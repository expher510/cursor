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
import { extractYouTubeVideoId } from '@/lib/utils';
import 'dotenv/config';
import { YoutubeTranscript } from 'youtube-transcript';

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
    description: 'Fetches the transcript and title for a given YouTube video URL via a universal transcript API.',
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
    const videoId = extractYouTubeVideoId(input.videoId);
    if (!videoId) {
      throw new Error(`Invalid YouTube video ID or URL: ${input.videoId}`);
    }
    
    // Use the correct base URL for the transcript service.
    const API_BASE_URL = 'https://api.supadata.ai/v1';
    const API_KEYS_STRING = process.env.TRANSCRIPT_API_KEYS;

    if (!API_KEYS_STRING) {
      // Fallback to youtube-transcript if API keys are not available
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        // Since youtube-transcript doesn't easily provide the title, we'll have to make a compromise.
        // A more robust solution might involve another API call to YouTube's Data API for the title.
        return { title: "YouTube Video", transcript };
      } catch (e: any) {
        console.error('youtube-transcript fallback failed:', e);
        throw new Error(`Could not get data from youtube-transcript for video ID: ${videoId}. Reason: ${e.message}`);
      }
    }
    
    const API_KEYS = API_KEYS_STRING.split(',').map(key => key.trim());
    if (API_KEYS.length === 0) {
      throw new Error('No API keys found in TRANSCRIPT_API_KEYS.');
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // First, get metadata like the title from youtube-transcript
    const videoInfo = await YoutubeTranscript.fetchTranscript(videoUrl, { lang: 'en' }).catch(() => null);
    const title = "YouTube Video";

    const requestUrl = new URL(`${API_BASE_URL}/transcript`);
    requestUrl.searchParams.append('url', videoUrl);
    requestUrl.searchParams.append('mode', 'auto');

    let lastError: any = null;

    for (const key of API_KEYS) {
        try {
            console.log(`Trying API key: ${key.substring(0, 5)}...`);
            const response = await fetch(requestUrl.toString(), {
                method: 'GET',
                headers: {
                    'x-api-key': key,
                },
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
                throw new Error(errorBody.message || `API request failed with status ${response.status}`);
            }

            const result = await response.json();
            const transcript = result.content || [];

            console.log(`Successfully fetched transcript with key: ${key.substring(0, 5)}...`);
            return { title, transcript };

        } catch (error: any) {
            console.error(`API key ${key.substring(0, 5)}... failed:`, error.message);
            lastError = error;
            // Continue to the next key
        }
    }
    
    // If all keys failed, throw the last error
    console.error('All API keys failed.');
    throw new Error(`Could not get data from transcript API for video ID: ${videoId}. Last error: ${lastError?.message}`);
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
      transcript,
    };
  }
);
