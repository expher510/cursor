
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts, title, and description
 * using the `youtube-caption-extractor` library.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its details.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getVideoDetails, type Subtitle } from 'youtube-caption-extractor';

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
  title: z.string().describe('The title of the YouTube video.'),
  description: z.string().describe('The description of the YouTube video.'),
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
    try {
        const videoDetails = await getVideoDetails({ videoID: videoId, lang });

        const formattedTranscript: TranscriptItem[] = (videoDetails.subtitles || []).map((item: Subtitle) => {
            return {
                text: item.text,
                offset: parseFloat(item.start) * 1000,
                duration: parseFloat(item.dur) * 1000,
            };
        });

        if (formattedTranscript.length === 0) {
             console.warn(`[LinguaStream] No transcript found for video ${videoId}, but returning details anyway.`);
        }
        
        return {
            title: videoDetails.title || `Video: ${videoId}`,
            description: videoDetails.description || 'No description available.',
            transcript: formattedTranscript,
        };

    } catch (e: any) {
         console.error("Failed to fetch video details:", e.message);
         if (e.message.includes('Transcript is disabled')) {
             throw new Error(`This video does not have captions enabled, so a transcript cannot be created. Please try a different video.`);
         }
         if (e.message.includes('Could not find transcript for this video')) {
             throw new Error(`No transcript available for the requested language (${lang}). Please try another video.`);
         }
         throw new Error(`Could not process video. Please check the video ID and try again. Original error: ${e.message}`);
    }
  }
);
