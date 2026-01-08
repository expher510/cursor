
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts and metadata.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its title, transcript, and other metadata.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';

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


// Fallback Tool: youtube-transcript library
const youtubeTranscriptTool = ai.defineTool(
    {
        name: 'youtubeTranscriptTool',
        description: 'Fetches the transcript for a given YouTube video ID directly. This is a fallback if other services fail.',
        inputSchema: z.object({ videoId: z.string() }),
        outputSchema: z.array(TranscriptItemSchema),
    },
    async ({ videoId }) => {
        try {
            console.log("Attempting to fetch transcript using youtube-transcript library...");
            
            // This logic is equivalent to the YoutubeTranscript.fetchTranscript method
            const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const html = await response.text();
            const innerTubeApiKeyMatch = html.match(/"innerTubeApiKey":"(.*?)"/);
            
            if (!innerTubeApiKeyMatch) {
              throw new Error("Could not find innerTubeApiKey. The video may not have a transcript.");
            }
            const innerTubeApiKey = innerTubeApiKeyMatch[1];
            
            const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (!playerResponseMatch) {
              throw new Error('Could not find ytInitialPlayerResponse. The video may not have a transcript.');
            }
            const playerResponse = JSON.parse(playerResponseMatch[1]);
            const captionTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

            if (!captionTracks || captionTracks.length === 0) {
              throw new Error('No caption tracks found for this video.');
            }

            const transcriptTrack = captionTracks.find((track: any) => track.kind === 'asr' && track.languageCode === 'en') || captionTracks[0];

            if (!transcriptTrack?.baseUrl) {
                throw new Error("Could not find a valid transcript track URL.");
            }

            const transcriptResponse = await fetch(transcriptTrack.baseUrl);
            const transcriptXml = await transcriptResponse.text();

            const transcriptItems = Array.from(transcriptXml.matchAll(/<text start="(.*?)" dur="(.*?)">(.*?)<\/text>/g))
              .map(match => ({
                  offset: parseFloat(match[1]) * 1000,
                  duration: parseFloat(match[2]) * 1000,
                  text: match[3]
                      .replace(/&amp;/g, '&')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
              }));


            console.log("Successfully fetched from youtube-transcript.");
            return transcriptItems;
        } catch (error: any) {
            console.error(`youtube-transcript failed: ${error.message}`);
            // If this also fails, we throw a final error that the user will see.
            throw new Error(`Could not retrieve transcript. The video may not have one available in English, or it might be disabled.`);
        }
    }
);

// Tool: YouTube Data API (for metadata)
const youtubeDataApiTool = ai.defineTool(
    {
        name: 'youtubeDataApiTool',
        description: 'Fetches video metadata (title, description, stats) from the YouTube Data API.',
        inputSchema: z.object({ videoId: z.string() }),
        outputSchema: z.object({
            title: z.string().nullable(),
            description: z.string().nullable(),
            stats: VideoStatsSchema.nullable(),
        })
    },
    async ({ videoId }) => {
        const API_KEY = process.env.YOUTUBE_DATA_API_KEY;
        if (!API_KEY || API_KEY === '<your_youtube_api_key>') {
            console.warn("YouTube Data API key not configured. Skipping metadata fetch.");
            return { title: null, description: null, stats: null };
        }
        
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${API_KEY}`;

        try {
            console.log("Fetching metadata from YouTube Data API...");
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody?.error?.message || `YouTube API request failed with status ${response.status}`);
            }
            const data = await response.json();
            const item = data.items?.[0];

            if (!item) {
                return { title: null, description: null, stats: null };
            }
            console.log("Successfully fetched metadata from YouTube.");

            return {
                title: item.snippet?.title || null,
                description: item.snippet?.description || null,
                stats: item.statistics ? {
                    viewCount: item.statistics.viewCount,
                    likeCount: item.statistics.likeCount,
                    commentCount: item.statistics.commentCount,
                } : null,
            };

        } catch (error: any) {
            console.warn(`YouTube Data API failed: ${error.message}`);
            return { title: null, description: null, stats: null };
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

    // Fetch metadata and transcript in parallel for better performance
    const [youtubeApiResult, transcript] = await Promise.all([
        youtubeDataApiTool({ videoId }),
        youtubeTranscriptTool({ videoId })
    ]);

    // If we have no transcript, we must throw an error.
    if (!transcript || transcript.length === 0) {
        throw new Error("Failed to retrieve transcript from any available source. The video may not have one.");
    }
    
    // Use the official YouTube API's title if available, otherwise default.
    const finalTitle = youtubeApiResult.title || 'YouTube Video';
    
    return {
      title: finalTitle,
      description: youtubeApiResult.description,
      transcript,
      stats: youtubeApiResult.stats,
    };
  }
);
