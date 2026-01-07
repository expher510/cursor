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


const makeWebhookTool = ai.defineTool(
  {
    name: 'makeWebhookTool',
    description: 'Fetches the transcript and title for a given YouTube video ID via a Make.com webhook.',
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
    
    const webhookUrl = 'https://hook.eu1.make.com/lnfjpfzvebak4khq1klqpofkdymfib7w';

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: videoId }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }

      // Make.com might wrap the response, so we parse it as JSON.
      const result = await response.json();

      // Assuming Make.com returns an object with { title, transcript }
      const { title, transcript } = result;

      if (!title || !transcript) {
        throw new Error('Invalid response from webhook. Expected { title, transcript }');
      }

      return { title, transcript };

    } catch (error: any) {
        console.error('Failed to fetch from webhook:', error);
        throw new Error(`Could not get data from webhook for video ID: ${videoId}. Reason: ${error.message}`);
    }
  }
);


const processVideoFlow = ai.defineFlow(
  {
    name: 'processVideoFlow',
    inputSchema: ProcessVideoInputSchema,
    outputSchema: ProcessVideoOutputSchema,
    tools: [makeWebhookTool],
  },
  async (input) => {
    // Call the new webhook tool
    const { title, transcript } = await makeWebhookTool(input);

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
