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
import { YoutubeTranscript } from 'youtube-transcript';

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
    const API_KEY = process.env.TRANSCRIPT_API_KEY;

    if (!API_KEY) {
      throw new Error('TRANSCRIPT_API_KEY is not set in the environment variables.');
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const requestUrl = new URL(`${API_BASE_URL}/transcript`);
    requestUrl.searchParams.append('url', videoUrl);
    requestUrl.searchParams.append('mode', 'auto');
    
    try {
      // First, get metadata like the title from youtube-transcript
      const videoInfo = await YoutubeTranscript.fetchTranscript(videoUrl, { lang: 'en' }).catch(() => null);

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
      
      // The Supadata API returns a `content` array with transcript segments.
      const transcript = result.content || [];
      
      const title = videoInfo && Array.isArray(videoInfo) && videoInfo.length > 0 && 'videoTitle' in videoInfo[0] ? videoInfo[0].videoTitle : "YouTube Video";

      return { title, transcript };

    } catch (error: any) {
        console.error('Failed to fetch from transcript API:', error);
        throw new Error(`Could not get data from transcript API for video ID: ${videoId}. Reason: ${error.message}`);
    }
  }
);

const translatePrompt = ai.definePrompt({
  name: 'translatePrompt',
  input: {
    schema: z.object({
      words: z.array(z.string()),
    }),
  },
  output: {
    schema: z.record(z.string()),
  },
  prompt: `Translate the following English words into Arabic. Return the translations as a JSON object where the keys are the original English words (in lowercase) and the values are their Arabic translations.

Words to translate:
{{#each words}}- {{{this}}}{{/each}}

Do not include any other text, only the JSON object.
`,
});


const processVideoFlow = ai.defineFlow(
  {
    name: 'processVideoFlow',
    inputSchema: ProcessVideoInputSchema,
    outputSchema: ProcessVideoOutputSchema,
  },
  async (input) => {
    
    const { title, transcript } = await transcriptApiTool(input);

    // Extract unique words from the transcript
    const allText = transcript.map(item => item.text).join(' ');
    const uniqueWords = Array.from(new Set(allText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').split(/\s+/).filter(Boolean)));
    
    // Get translations
    const { output: translations } = await translatePrompt({ words: uniqueWords });

    return {
      title,
      transcript,
      translations: translations || {},
    };
  }
);
