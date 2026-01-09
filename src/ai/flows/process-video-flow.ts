
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts and metadata.
 * It uses the youtube-caption-extractor library for transcripts and details.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its title, description, and transcript.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getVideoDetails, type Subtitle } from 'youtube-caption-extractor';

// Schema Definitions

const ProcessVideoInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to process.'),
});
export type ProcessVideoInput = z.infer<typeof ProcessVideoInputSchema>;

const TranscriptItemSchema = z.object({
  text: z.string(),
  offset: z.number(),
  duration: z.number(),
});
export type TranscriptItem = z.infer<typeof TranscriptItemSchema>;

const ProcessVideoOutputSchema = z.object({
  title: z.string().describe('The title of the video.'),
  description: z.string().optional().nullable().describe('The description of the video.'),
  transcript: z.array(TranscriptItemSchema).describe('The transcript of the video with timestamps.'),
});
export type ProcessVideoOutput = z.infer<typeof ProcessVideoOutputSchema>;


// This is the public wrapper function that components will call.
export async function processVideo(input: ProcessVideoInput): Promise<ProcessVideoOutput> {
  return processVideoFlow(input);
}


// The Main Flow
const processVideoFlow = ai.defineFlow(
  {
    name: 'processVideoFlow',
    inputSchema: ProcessVideoInputSchema,
    outputSchema: ProcessVideoOutputSchema,
  },
  async ({ videoId }) => {
    
    try {
        const details = await getVideoDetails({ videoID: videoId, lang: 'en' });

        if (!details.subtitles || details.subtitles.length === 0) {
            throw new Error("No transcript found for this video. It might not have captions enabled.");
        }

        // Transform subtitles to the format our app expects
        const formattedTranscript: TranscriptItem[] = details.subtitles.map((sub: Subtitle) => ({
            text: sub.text,
            offset: parseFloat(sub.start) * 1000,
            duration: parseFloat(sub.dur) * 1000,
        }));
        
        return {
            title: details.title,
            description: details.description,
            transcript: formattedTranscript,
        };

    } catch (e: any) {
         console.error("Failed to fetch video details or transcript:", e.message);
         // Re-throw with a more user-friendly message
         throw new Error(`Could not process video. Please check the video ID and try again. Original error: ${e.message}`);
    }
  }
);
