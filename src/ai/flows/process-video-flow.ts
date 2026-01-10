
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts
 * using the `youtube-transcript` library.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its transcript.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { YoutubeTranscript } from 'youtube-transcript';

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
        const transcriptResponse = await YoutubeTranscript.fetchTranscript(videoUrl, { lang });
        
        if (!transcriptResponse || transcriptResponse.length === 0) {
             throw new Error("No transcript found for this video. It might not have captions enabled in the requested language.");
        }
        
        const formattedTranscript: TranscriptItem[] = transcriptResponse.map((item, index) => {
            const nextItem = transcriptResponse[index + 1];
            const duration = nextItem ? nextItem.offset - item.offset : 3000;
            return {
                ...item,
                offset: item.offset,
                duration: duration,
            };
        });
        
        return {
            transcript: formattedTranscript,
        };

    } catch (e: any) {
         console.error("Failed to fetch transcript:", e.message);
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
