
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts and metadata
 * using the `youtube-transcript` and `ytdl-core` libraries.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its title, description, and transcript.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from 'ytdl-core';

// Schema Definitions
const ProcessVideoInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to process.'),
  lang: z.string().optional().default('en').describe('The language code for the transcript.'),
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
  async ({ videoId, lang }) => {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
        // Fetch transcript and video info concurrently
        const [transcriptResponse, videoInfo] = await Promise.all([
             YoutubeTranscript.fetchTranscript(videoUrl, { lang }),
             ytdl.getInfo(videoUrl)
        ]);
        
        if (!transcriptResponse || transcriptResponse.length === 0) {
             throw new Error("No transcript found for this video. It might not have captions enabled in the requested language.");
        }
        
        // The API returns offset in milliseconds, but duration is not provided by this library, so we'll have to estimate it.
        const formattedTranscript: TranscriptItem[] = transcriptResponse.map((item, index) => {
            const nextItem = transcriptResponse[index + 1];
            // Estimate duration based on the start of the next item, or a default of 3 seconds if it's the last one.
            const duration = nextItem ? nextItem.offset - item.offset : 3000;
            return {
                ...item,
                offset: item.offset, // Already in milliseconds
                duration: duration,
            };
        });
        
        return {
            title: videoInfo.videoDetails.title,
            description: videoInfo.videoDetails.description,
            transcript: formattedTranscript,
        };

    } catch (e: any) {
         console.error("Failed to fetch video details or transcript:", e.message);
         // Re-throw with a more user-friendly message
         if (e.message.includes('Could not find transcript for this video')) {
             throw new Error(`No transcript available for the requested language (${lang}). Please try another video.`);
         }
         throw new Error(`Could not process video. Please check the video ID and try again. Original error: ${e.message}`);
    }
  }
);
