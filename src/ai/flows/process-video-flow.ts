
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts and metadata.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its title, transcript, and other metadata.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import 'dotenv/config';
import { google } from 'googleapis';

// Schema Definitions

const ProcessVideoInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to process.'),
});
export type ProcessVideoInput = z.infer<typeof ProcessVideoInputSchema>;

const TranscriptItemSchema = z.object({
  text: z.string(),
  offset: z.number(),
  duration: z.number(),
  videoId: z.string().optional(),
});
export type TranscriptItem = z.infer<typeof TranscriptItemSchema>;

const VideoStatsSchema = z.object({
    viewCount: z.string().optional(),
    likeCount: z.string().optional(),
    commentCount: z.string().optional(),
}).optional();
export type VideoStats = z.infer<typeof VideoStatsSchema>;


const ProcessVideoOutputSchema = z.object({
  title: z.string().describe('The title of the video.'),
  description: z.string().optional().nullable().describe('The description of the video.'),
  transcript: z.array(TranscriptItemSchema).describe('The transcript of the video with timestamps.'),
  stats: VideoStatsSchema.nullable(),
});
export type ProcessVideoOutput = z.infer<typeof ProcessVideoOutputSchema>;


// This is the public wrapper function that components will call.
export async function processVideo(input: ProcessVideoInput): Promise<ProcessVideoOutput> {
  return processVideoFlow(input);
}

// Tool: YouTube Data API v3
const youtubeApiTool = ai.defineTool(
    {
        name: 'youtubeApiTool',
        description: 'Fetches video metadata (title, description, stats) from the YouTube Data API v3.',
        inputSchema: z.object({ videoId: z.string() }),
        outputSchema: z.object({
            title: z.string().nullable(),
            description: z.string().nullable(),
            stats: VideoStatsSchema.nullable(),
        }),
    },
    async ({ videoId }) => {
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) {
            console.warn('YouTube API key is not configured. Skipping YouTube API call.');
            return { title: null, description: null, stats: null };
        }
        
        try {
            const youtube = google.youtube({
                version: 'v3',
                auth: YOUTUBE_API_KEY,
            });

            const response = await youtube.videos.list({
                part: ['snippet', 'statistics'],
                id: [videoId],
            });

            const video = response.data.items?.[0];
            if (!video) {
                return { title: null, description: null, stats: null };
            }

            return {
                title: video.snippet?.title || null,
                description: video.snippet?.description || null,
                stats: {
                    viewCount: video.statistics?.viewCount,
                    likeCount: video.statistics?.likeCount,
                    commentCount: video.statistics?.commentCount,
                },
            };
        } catch (error: any) {
            console.error(`YouTube API failed: ${error.message}`);
            // Don't throw, just return nulls so the fallback can be used.
            return { title: null, description: null, stats: null };
        }
    }
);


// Tool: Supadata API (Primary Source for Transcript and Fallback Metadata)
const supadataApiTool = ai.defineTool(
  {
    name: 'supadataApiTool',
    description: 'Fetches the transcript and basic metadata for a given YouTube video using the Supadata API.',
    inputSchema: z.object({ videoId: z.string() }),
    outputSchema: z.object({
      title: z.string().nullable(),
      transcript: z.array(TranscriptItemSchema),
    }),
  },
  async ({ videoId }) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const API_BASE_URL = 'https://api.supadata.ai/v1/transcript';
    const API_KEY = process.env.SUPADATA_API_KEY;

    if (!API_KEY) {
      throw new Error('Supadata API key is not configured.');
    }
    
    try {
        const requestUrl = new URL(API_BASE_URL);
        requestUrl.searchParams.append('url', youtubeUrl);
        requestUrl.searchParams.append('lang', 'en');
        requestUrl.searchParams.append('mode', 'native');

        const response = await fetch(requestUrl.toString(), {
            method: 'GET',
            headers: { 'x-api-key': API_KEY },
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: `Supadata API request failed with status ${response.status}` }));
            throw new Error(errorBody.message);
        }

        const result = await response.json();
        return {
            title: result.title || null,
            transcript: result.content || [],
        };

    } catch (error: any) {
        console.error(`Supadata API failed: ${error.message}`);
        throw new Error(`Could not get transcript from Supadata. Reason: ${error.message}`);
    }
  }
);


// The Main Flow
const processVideoFlow = ai.defineFlow(
  {
    name: 'processVideoFlow',
    inputSchema: ProcessVideoInputSchema,
    outputSchema: ProcessVideoOutputSchema,
  },
  async ({ videoId }) => {

    // Run API calls in parallel
    const [youtubeResult, supadataResult] = await Promise.all([
        youtubeApiTool({ videoId }),
        supadataApiTool({ videoId })
    ]);
    
    // Ensure transcript exists, otherwise it's a critical failure
    const transcript = supadataResult.transcript;
    if (transcript.length === 0) {
        throw new Error("Failed to retrieve transcript. The video may not have one available.");
    }
    
    // Combine results with fallback logic
    const title = youtubeResult?.title || supadataResult?.title || 'YouTube Video';
    const description = youtubeResult?.description ?? null;
    const stats = youtubeResult?.stats ?? null;

    if (!title) {
        throw new Error("Failed to retrieve video title from any source.");
    }

    return {
      title,
      description,
      transcript,
      stats,
    };
  }
);
