'use server';
/**
 * @fileOverview A flow for extracting the audio URL from a YouTube video.
 *
 * - extractAudio - A function that takes a YouTube video ID and returns a public URL for its audio.
 * - ExtractAudioInput - The input type for the extractAudio function.
 * - ExtractAudioOutput - The return type for the extractAudio function.
 */

import { z } from 'zod';
import 'dotenv/config';

// Define the schema for the input of our flow
const ExtractAudioInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video.'),
});
export type ExtractAudioInput = z.infer<typeof ExtractAudioInputSchema>;

// Define the schema for the output of our flow
const ExtractAudioOutputSchema = z.object({
  audioUrl: z.string().url().describe('The public URL of the extracted audio.'),
});
export type ExtractAudioOutput = z.infer<typeof ExtractAudioOutputSchema>;

/**
 * Extracts a public audio URL from a YouTube video using the coolguruji RapidAPI service.
 * @param input - An object containing the videoId.
 * @returns A promise that resolves to an object containing the audioUrl.
 * @throws An error if the API call fails or returns an invalid response.
 */
export async function extractAudio(input: ExtractAudioInput): Promise<ExtractAudioOutput> {
    const { videoId } = ExtractAudioInputSchema.parse(input);
    const apiKey = process.env.X_RAPIDAPI_KEY;

    if (!apiKey) {
        throw new Error('RapidAPI key is not configured in environment variables.');
    }

    const url = `https://coolguruji-youtube-to-mp3-download-v1.p.rapidapi.com/?id=${videoId}`;
	const options = {
		method: 'GET',
		headers: {
			'x-rapidapi-key': apiKey,
			'x-rapidapi-host': 'coolguruji-youtube-to-mp3-download-v1.p.rapidapi.com'
		}
	};

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`RapidAPI request failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        // The API might return an array of links or a single object with a link
        const link = result.link || (Array.isArray(result) && result[0]?.link);

        if (link && typeof link === 'string') {
             return { audioUrl: link };
        } else {
            console.error("Unexpected API response structure:", result);
            throw new Error('Failed to extract audio URL from API response.');
        }

    } catch (error) {
        console.error('Error extracting audio:', error);
        throw new Error('Failed to extract audio from video.');
    }
}
