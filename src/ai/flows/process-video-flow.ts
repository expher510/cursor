
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
import { YoutubeTranscript } from 'youtube-transcript';

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
        console.log("Attempting to fetch transcript from Supadata...");
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
        console.log("Successfully fetched from Supadata.");
        return {
            title: result.title || null,
            transcript: result.content || [],
        };

    } catch (error: any) {
        console.warn(`Supadata API failed: ${error.message}.`);
        // Don't throw, just return empty so the flow can fall back.
        return { title: null, transcript: [] };
    }
  }
);

// Fallback Tool: youtube-transcript library
const youtubeTranscriptTool = ai.defineTool(
    {
        name: 'youtubeTranscriptTool',
        description: 'Fetches the transcript for a given YouTube video ID directly.',
        inputSchema: z.object({ videoId: z.string() }),
        outputSchema: z.array(TranscriptItemSchema),
    },
    async ({ videoId }) => {
        try {
            console.log("Attempting to fetch transcript using youtube-transcript library...");
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            console.log("Successfully fetched from youtube-transcript.");
            return transcript;
        } catch (error: any) {
            console.error(`youtube-transcript failed: ${error.message}`);
            // If this also fails, we throw a final error.
            throw new Error(`Could not get transcript from any source. Reason: ${error.message}`);
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

    // 1. Try primary source
    let { title, transcript } = await supadataApiTool({ videoId });
    
    // 2. If primary source fails for transcript, try fallback
    if (transcript.length === 0) {
        console.log("Supadata returned no transcript, trying youtube-transcript fallback...");
        transcript = await youtubeTranscriptTool({ videoId });
    }

    // 3. Ensure transcript exists after all attempts, otherwise it's a critical failure
    if (transcript.length === 0) {
        throw new Error("Failed to retrieve transcript. The video may not have one available.");
    }
    
    // Use a default title if none was fetched
    const finalTitle = title || 'YouTube Video';
    
    return {
      title: finalTitle,
      description: null, // No description source for now
      transcript,
      stats: null, // No stats source for now
    };
  }
);
