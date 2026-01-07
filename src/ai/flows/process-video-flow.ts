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
import { YoutubeTranscript } from 'youtube-transcript';
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


const youtubeTranscriptTool = ai.defineTool(
  {
    name: 'youtubeTranscriptTool',
    description: 'Fetches the transcript and title for a given YouTube video ID.',
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
    
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        // In a real scenario, you would fetch the title via the YouTube Data API.
        // For now, we will return a placeholder title.
        const title = "YouTube Video"; 
        return { title, transcript };
    } catch (error) {
        console.error('Failed to fetch transcript:', error);
        throw new Error(`Could not fetch transcript for video ID: ${videoId}`);
    }
  }
);


const processVideoFlow = ai.defineFlow(
  {
    name: 'processVideoFlow',
    inputSchema: ProcessVideoInputSchema,
    outputSchema: ProcessVideoOutputSchema,
    tools: [youtubeTranscriptTool],
  },
  async (input) => {
    const { title, transcript } = await youtubeTranscriptTool(input);

    const transcriptText = transcript.map(t => t.text).join(' ');

    const vocabularyPrompt = `
      You are an expert language teacher. Given the following transcript from a video,
      identify up to 20 key vocabulary words or short phrases that would be
      valuable for a language learner. For each word/phrase, provide a simple translation
      in Arabic.

      Focus on words that are common, useful, or relevant to the main topic of the video.
      Avoid proper nouns unless they are crucial.

      Transcript:
      """
      ${transcriptText.substring(0, 2000)}
      """

      Return ONLY a JSON object with the identified words as keys and their Arabic translations as values.
      Example: {"hello": "مرحبا", "world": "عالم"}
    `;

    const llmResponse = await ai.generate({
      prompt: vocabularyPrompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let translations = {};
    try {
      const jsonResponse = llmResponse.text;
      translations = JSON.parse(jsonResponse);
    } catch (e) {
      console.error("Failed to parse vocabulary JSON from LLM response", e);
      // Return empty translations if parsing fails
    }
    
    // Convert transcript to a format that matches ProcessVideoOutputSchema
    const formattedTranscript = transcript.map(item => ({
        ...item,
        timestamp: new Date(item.offset).toISOString().substr(14, 5) // Format to MM:SS
    }));

    return {
      title: title,
      transcript: formattedTranscript,
      translations,
    };
  }
);
