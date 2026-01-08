
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts and metadata.
 * It uses Piped API for metadata and youtube-transcript library for transcripts.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its title, transcript, and other metadata.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';
import { YoutubeTranscript } from 'youtube-transcript';


// Schema Definitions

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

const VideoStatsSchema = z.object({
    views: z.number().optional(),
    likes: z.number().optional(),
    commentCount: z.number().optional(),
}).optional();
export type VideoStats = z.infer<typeof VideoStatsSchema>;


const ProcessVideoOutputSchema = z.object({
  title: z.string().describe('The title of the video.'),
  description: z.string().optional().nullable().describe('The description of the video.'),
  transcript: z.array(TranscriptItemSchema).describe('The transcript of the video with timestamps.'),
  stats: VideoStatsSchema.nullable(),
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
  async ({ videoId }) => {
    
    // 1. Fetch metadata from Piped API
    const streamUrl = `https://pipedapi.kavin.rocks/streams/${videoId}`;
    let streamData;
    try {
        const streamResponse = await fetch(streamUrl);
        if (!streamResponse.ok) {
            throw new Error(`Piped API request for metadata failed with status ${streamResponse.status}`);
        }
        streamData = await streamResponse.json();
    } catch(e: any) {
        console.error("Failed to fetch stream data from Piped API:", e.message);
        throw new Error("Could not retrieve video information. The video might be private or deleted.");
    }

    const { title, description, views, likes } = streamData;
    
    // 2. Fetch the transcript using the youtube-transcript library
    let transcript;
    try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);

        // FOR DEBUGGING: Throw the raw response to show it in the UI
        throw new Error("Transcript API Response: \n" + JSON.stringify(transcript, null, 2));

    } catch (e: any) {
         console.error("Failed to fetch transcript:", e.message);
         // Re-throw with a more user-friendly message
         if (e.message.includes('Transcript API Response')) {
             throw e; // Re-throw the debug error as is
         }
         throw new Error("Could not retrieve transcript. The video may not have subtitles enabled.");
    }
    
    if (!transcript || transcript.length === 0) {
        throw new Error("The retrieved transcript was empty. It might be in an unsupported format or disabled for this video.");
    }

    // 3. Format the data and return
    return {
      title: title || 'YouTube Video',
      description: description,
      transcript: transcript,
      stats: {
          views: views,
          likes: likes,
          commentCount: 0, 
      },
    };
  }
);
