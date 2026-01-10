
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

// Function to poll the API until the link is ready
const pollForLink = async (videoId: string, apiKey: string): Promise<any> => {
    const url = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
        }
    };
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }
    const result = await response.json();
    if (!result || typeof result !== 'object') {
        throw new Error('Invalid JSON response from API');
    }
    return result;
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
    
    try {
        let result = await pollForLink(videoId, apiKey);

        // If the API returns a processing status, wait and poll again.
        if (result.status === 'processing') {
            console.log(`Audio for ${videoId} is processing, waiting 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
            result = await pollForLink(videoId, apiKey);
        }

        if (result.status === 'ok' && result.link) {
             return { audioUrl: result.link };
        } else {
            // Handle other statuses like 'fail' or unexpected responses after retry
            throw new Error(`Failed to extract audio. Final status: ${result.status}, Message: ${result.msg}`);
        }
    } catch (e: any) {
        console.error("Failed to extract audio from video:", e.message);
        throw new Error(`Could not extract audio. Original error: ${e.message}`);
    }
  }
);
