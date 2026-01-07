'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts and generate vocabulary.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its title, transcript, and a vocabulary list.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MOCK_VIDEO_DATA } from '@/lib/data';

const ProcessVideoInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to process.'),
});
export type ProcessVideoInput = z.infer<typeof ProcessVideoInputSchema>;

const TranscriptItemSchema = z.object({
  timestamp: z.string(),
  text: z.string(),
});

const ProcessVideoOutputSchema = z.object({
  title: z.string().describe('The title of the video.'),
  transcript: z.array(TranscriptItemSchema).describe('The transcript of the video with timestamps.'),
  translations: z.record(z.string()).describe('A dictionary of words from the transcript and their translations.'),
});
export type ProcessVideoOutput = z.infer<typeof ProcessVideoOutputSchema>;

// This is a wrapper function that we will call from our components.
export async function processVideo(input: ProcessVideoInput): Promise<ProcessVideoOutput> {
  return processVideoFlow(input);
}

const processVideoFlow = ai.defineFlow(
  {
    name: 'processVideoFlow',
    inputSchema: ProcessVideoInputSchema,
    outputSchema: ProcessVideoOutputSchema,
  },
  async (input) => {
    // In a real implementation, we would use a tool to fetch the transcript
    // from YouTube and another tool/prompt to generate the vocabulary list.
    // For now, we will use mock data to simulate this process.
    
    // TODO: Replace with actual transcript fetching and AI-based vocabulary generation.
    return {
      title: MOCK_VIDEO_DATA.title,
      transcript: MOCK_VIDEO_DATA.transcript,
      translations: MOCK_VIDEO_DATA.translations,
    };
  }
);
