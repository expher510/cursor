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
  offset: z.number(),
  duration: z.number(),
});
export type TranscriptItem = z.infer<typeof TranscriptItemSchema>;

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
    
    // IMPORTANT: Replace this with the actual base URL of the transcript service.
    const API_BASE_URL = 'https://api.transcriptservice.com';
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
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
      }

      const result = await response.json();
      
      // The new API might return a job ID for longer videos. This basic implementation
      // doesn't handle polling for results, it assumes a synchronous response.
      if (result.jobId) {
        throw new Error('Video is too large for a synchronous response. Asynchronous polling is not yet implemented.');
      }

      // Assuming the API returns a `content` array for the transcript.
      // And we'll use a placeholder for the title as the API doesn't seem to return it.
      const transcript = result.content || [];
      const title = "YouTube Video"; // Placeholder title

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
    
    const formattedTranscript = transcript.map(item => ({
        ...item,
    }));

    return {
      title: title,
      transcript: formattedTranscript,
      translations,
    };
  }
);
