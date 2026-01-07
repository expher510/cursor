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
import { extractYouTubeVideoId } from '@/lib/utils';
import 'dotenv/config';

const ProcessVideoInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to process.'),
});
export type ProcessVideoInput = z.infer<typeof ProcessVideoInputSchema>;

const TranscriptItemSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
});
export type TranscriptItem = z.infer<typeof TranscriptItemSchema>;

const ProcessVideoOutputSchema = z.object({
  title: z.string().describe('The title of the video.'),
  transcript: z.array(z.object({
    text: z.string(),
    offset: z.number(),
    duration: z.number(),
  })).describe('The transcript of the video with timestamps.'),
  translations: z.record(z.string()).describe('A dictionary of words from the transcript and their translations.'),
});
export type ProcessVideoOutput = z.infer<typeof ProcessVideoOutputSchema>;

// This is a wrapper function that we will call from our components.
export async function processVideo(input: ProcessVideoInput): Promise<ProcessVideoOutput> {
  return processVideoFlow(input);
}


const transcriptApiTool = ai.defineTool(
  {
    name: 'transcriptApiTool',
    description: 'Fetches the transcript and title for a given YouTube video URL via a universal transcript API.',
    inputSchema: z.object({ videoId: z.string() }),
    outputSchema: z.object({
      title: z.string(),
      transcript: z.array(TranscriptItemSchema),
    }),
  },
  async (input) => {
    const videoId = extractYouTubeVideoId(input.videoId);
    if (!videoId) {
      throw new Error(`Invalid YouTube video ID or URL: ${input.videoId}`);
    }
    
    // Use the correct base URL for the transcript service.
    const API_BASE_URL = 'https://api.oneai.com/api/v0';
    const API_KEY = process.env.TRANSCRIPT_API_KEY;

    if (!API_KEY) {
      throw new Error('TRANSCRIPT_API_KEY is not set in the environment variables.');
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const requestUrl = new URL(`${API_BASE_URL}/transcript`);
    requestUrl.searchParams.append('url', videoUrl);
    requestUrl.searchParams.append('mode', 'auto');
    
    try {
      const response = await fetch(requestUrl.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json();
        const errorMessage = errorBody.message || `API request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // The API returns a `transcription` object which contains the transcript segments.
      const transcript = result.transcription?.utterances.map((utt: any) => ({
        text: utt.text,
        start: utt.start, // API returns start/end in seconds
        end: utt.end,
      })) || [];

      // The API may return a title, otherwise use a placeholder.
      const title = result.title || "YouTube Video";

      return { title, transcript };

    } catch (error: any) {
        console.error('Failed to fetch from transcript API:', error);
        throw new Error(`Could not get data from transcript API for video ID: ${videoId}. Reason: ${error.message}`);
    }
  }
);


const processVideoFlow = ai.defineFlow(
  {
    name: 'processVideoFlow',
    inputSchema: ProcessVideoInputSchema,
    outputSchema: ProcessVideoOutputSchema,
    tools: [transcriptApiTool],
  },
  async (input) => {
    // Call the new transcript API tool
    const { title, transcript } = await transcriptApiTool(input);

    // As requested, the AI part is disabled for now.
    // We will return an empty object for translations.
    const translations = {};
    
    // The new API provides 'start' and 'end' in seconds. We need to convert it to the offset/duration format expected by the rest of the app.
    const formattedTranscript = transcript.map(item => ({
        text: item.text,
        offset: item.start * 1000, // convert seconds to milliseconds
        duration: (item.end - item.start) * 1000, // calculate duration in milliseconds
    }));

    return {
      title: title,
      transcript: formattedTranscript,
      translations,
    };
  }
);
