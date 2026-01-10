
'use server';
/**
 * @fileOverview A flow for extracting the audio URL from a YouTube video using the YouTube MP3 API.
 * - extractAudio - A function that takes a YouTube video ID and returns a direct link to the audio.
 * - ExtractAudioInput - The input type for the extractAudio function.
 * - ExtractAudioOutput - The return type for the extractAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';

// Schema Definitions
const ExtractAudioInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to process.'),
});
export type ExtractAudioInput = z.infer<typeof ExtractAudioInputSchema>;

const ExtractAudioOutputSchema = z.object({
  audioUrl: z.string().describe('A direct link to the downloadable MP3 audio file.'),
});
export type ExtractAudioOutput = z.infer<typeof ExtractAudioOutputSchema>;


// This is the public wrapper function that components will call.
export async function extractAudio(input: ExtractAudioInput): Promise<ExtractAudioOutput> {
  return extractAudioFlow(input);
}


// The Main Flow
const extractAudioFlow = ai.defineFlow(
  {
    name: 'extractAudioFlow',
    inputSchema: ExtractAudioInputSchema,
    outputSchema: ExtractAudioOutputSchema,
  },
  async ({ videoId }) => {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error("RAPIDAPI_KEY is not defined in environment variables.");
    }
    
    const url = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const result = await response.json();
        
        if (result.status === 'ok' && result.link) {
             return { audioUrl: result.link };
        } else {
            throw new Error(result.msg || 'Failed to extract audio link from API response.');
        }
    } catch (e: any) {
        console.error("Failed to extract audio from video:", e.message);
        throw new Error(`Could not extract audio. Original error: ${e.message}`);
    }
  }
);
