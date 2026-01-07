
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its title and transcript.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import 'dotenv/config';

const ProcessVideoInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to process.'),
});
export type ProcessVideoInput = z.infer<typeof ProcessVideoInputSchema>;

const TranscriptItemSchema = z.object({
  text: z.string(),
  offset: z.number(),
  duration: z.number(),
  videoId: z.string().optional(), // Make videoId optional here
});
export type TranscriptItem = z.infer<typeof TranscriptItemSchema>;

const ProcessVideoOutputSchema = z.object({
  title: z.string().describe('The title of the video.'),
  transcript: z.array(TranscriptItemSchema).describe('The transcript of the video with timestamps.'),
});
export type ProcessVideoOutput = z.infer<typeof ProcessVideoOutputSchema>;

// This is a wrapper function that we will call from our components.
export async function processVideo(input: ProcessVideoInput): Promise<ProcessVideoOutput> {
  return processVideoFlow(input);
}


const transcriptApiTool = ai.defineTool(
  {
    name: 'transcriptApiTool',
    description: 'Fetches the transcript for a given YouTube video using the Supadata API.',
    inputSchema: z.object({ videoId: z.string() }),
    outputSchema: z.object({
      title: z.string(),
      transcript: z.array(z.object({
        text: z.string(),
        offset: z.number(),
        duration: z.number(),
      })),
    }),
  },
  async (input) => {
    const { videoId } = input;
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const API_BASE_URL = 'https://api.supadata.ai/v1/transcript';
    const API_KEY = process.env.SUPADATA_API_KEY;

    if (!API_KEY) {
      throw new Error('Supadata API key is not configured in .env file (SUPADATA_API_KEY).');
    }
    
    // For now, we'll just use a generic title. A robust solution might fetch this separately.
    const title = "YouTube Video";

    try {
        const requestUrl = new URL(API_BASE_URL);
        requestUrl.searchParams.append('url', youtubeUrl);
        requestUrl.searchParams.append('lang', 'en');
        requestUrl.searchParams.append('mode', 'native'); // Fetch existing transcripts to avoid generation costs

        const response = await fetch(requestUrl.toString(), {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
            },
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
            throw new Error(errorBody.message || `API request failed with status ${response.status}`);
        }

        const result = await response.json();
        
        // The Supadata API response for text=false has content as an array of objects
        const transcript = result.content || [];

        return { title, transcript };

    } catch (error: any) {
        console.error(`Supadata API failed:`, error.message);
        throw new Error(`Could not get transcript from Supadata for video ID: ${videoId}. Reason: ${error.message}`);
    }
  }
);

const processVideoFlow = ai.defineFlow(
  {
    name: 'processVideoFlow',
    inputSchema: ProcessVideoInputSchema,
    outputSchema: ProcessVideoOutputSchema,
  },
  async (input) => {
    
    const { title, transcript } = await transcriptApiTool(input);

    return {
      title,
      transcript: transcript,
    };
  }
);
