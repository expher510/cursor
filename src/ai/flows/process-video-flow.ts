
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
    views: z.number().optional(),
    likes: z.number().optional(),
    commentCount: z.number().optional(),
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


// Fallback Tool: youtube-transcript library logic
const youtubeTranscriptTool = ai.defineTool(
    {
        name: 'youtubeTranscriptTool',
        description: 'Fetches the transcript for a given YouTube video ID directly.',
        inputSchema: z.object({ videoId: z.string() }),
        outputSchema: z.array(TranscriptItemSchema),
    },
    async ({ videoId }) => {
        try {
            console.log(`Attempting to fetch transcript for ${videoId} using youtube-transcript library...`);
            
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);

            if (!transcript || transcript.length === 0) {
                 throw new Error("Transcript was found but contained no text content.");
            }

            console.log(`Successfully fetched and parsed ${transcript.length} transcript lines.`);
            return transcript;

        } catch (error: any) {
            console.error(`Transcript fetching failed: ${error.message}`);
            // Re-throw the specific error message to be displayed to the user.
            throw new Error(`Could not retrieve transcript. The video may not have subtitles enabled or is otherwise unavailable.`);
        }
    }
);

// Tool: Piped API (for metadata)
const pipedApiTool = ai.defineTool(
    {
        name: 'pipedApiTool',
        description: 'Fetches video metadata (title, description, stats) from the Piped API.',
        inputSchema: z.object({ videoId: z.string() }),
        outputSchema: z.object({
            title: z.string().nullable(),
            description: z.string().nullable(),
            stats: VideoStatsSchema.nullable(),
        })
    },
    async ({ videoId }) => {
        const url = `https://pipedapi.kavin.rocks/streams/${videoId}`;

        try {
            console.log("Fetching metadata from Piped API...");
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                console.error("Piped API Error Body:", errorBody);
                throw new Error(errorBody?.message || `Piped API request failed with status ${response.status}`);
            }
            const data = await response.json();
            
            if (!data) {
                console.warn("No data found in Piped API response for videoId:", videoId);
                return { title: null, description: null, stats: null };
            }

            return {
                title: data.title || null,
                description: data.description || null,
                stats: {
                    views: data.views,
                    likes: data.likes,
                    commentCount: 0, // Piped /streams endpoint doesn't provide commentCount directly
                },
            };

        } catch (error: any) {
            console.warn(`Piped API failed: ${error.message}`);
            // Return nulls if the API fails for any reason
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
    const [pipedApiResult, transcriptResult] = await Promise.all([
        pipedApiTool({ videoId }),
        youtubeTranscriptTool({ videoId }).catch(err => err as Error) // Catch transcript errors specifically
    ]);

    // If transcript resulted in an error, throw it.
    if (transcriptResult instanceof Error) {
        throw transcriptResult;
    }
    
    // If we have no transcript, we must throw an error.
    if (!transcriptResult || transcriptResult.length === 0) {
        throw new Error("Failed to retrieve transcript from any available source. The video may not have one.");
    }
    
    // Use the Piped API's title if available, otherwise default.
    const finalTitle = pipedApiResult.title || 'YouTube Video';
    
    return {
      title: finalTitle,
      description: pipedApiResult.description,
      transcript: transcriptResult,
      stats: pipedApiResult.stats,
    };
  }
);
