
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts and metadata
 * using the Youtube Transcriptor RapidAPI.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its title, description, and transcript.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';

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
  title: z.string().describe('The title of the video.'),
  description: z.string().optional().nullable().describe('The description of the video.'),
  transcript: z.array(TranscriptItemSchema).describe('The transcript of the video with timestamps.'),
  availableLangs: z.array(z.string()).describe('A list of available language codes for the transcript.'),
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
    
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error("RAPIDAPI_KEY is not defined in environment variables.");
    }
    
    const url = `https://youtube-transcriptor.p.rapidapi.com/transcript?video_id=${videoId}&lang=${lang}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'youtube-transcriptor.p.rapidapi.com'
        }
    };
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
             throw new Error("No transcript found for this video. It might not have captions enabled in the requested language.");
        }
        
        const videoInfo = data[0];

        // The API returns offset and duration as strings, convert them to numbers (milliseconds)
        const formattedTranscript: TranscriptItem[] = (videoInfo.transcript || []).map((sub: any) => ({
            text: sub.text,
            offset: parseFloat(sub.offset) * 1000,
            duration: parseFloat(sub.duration) * 1000,
        }));
        
        return {
            title: videoInfo.title,
            description: videoInfo.description,
            transcript: formattedTranscript,
            availableLangs: videoInfo.availableLangs || [],
        };

    } catch (e: any) {
         console.error("Failed to fetch video details or transcript:", e.message);
         // Re-throw with a more user-friendly message
         throw new Error(`Could not process video. Please check the video ID and try again. Original error: ${e.message}`);
    }
  }
);
