
'use server';
/**
 * @fileOverview This flow processes a YouTube video ID to extract its details and transcript.
 * It now runs entirely on the server to avoid client-side issues with YouTube's services.
 */

import { z } from 'zod';
import { getVideoDetails, getSubtitles, type Subtitle } from 'youtube-caption-extractor';
import type { TranscriptItem } from '@/lib/quiz-data';

const ProcessVideoInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to process.'),
  lang: z.string().default('en').describe('The preferred language for the transcript (e.g., "en", "es").'),
});
export type ProcessVideoInput = z.infer<typeof ProcessVideoInputSchema>;

const ProcessVideoOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  transcript: z.array(z.object({
    text: z.string(),
    offset: z.number(),
    duration: z.number(),
  })),
  sourceLang: z.string(),
});
export type ProcessVideoOutput = z.infer<typeof ProcessVideoOutputSchema>;


export async function processVideo(input: ProcessVideoInput): Promise<ProcessVideoOutput> {
  const { videoId, lang } = ProcessVideoInputSchema.parse(input);

  if (!videoId) {
    throw new Error('A video ID is required to process a video.');
  }

  try {
    let subtitles: Subtitle[];
    let sourceLang = lang;

    try {
      // First, try fetching with the specified language
      subtitles = await getSubtitles({ videoID: videoId, lang: sourceLang });
    } catch (e: any) {
       // If the specified language fails, fall back to English as a common default
       if (e.message.includes('Could not find transcript')) {
           console.warn(`Transcript not found in ${lang}, falling back to English.`);
           sourceLang = 'en';
           subtitles = await getSubtitles({ videoID: videoId, lang: sourceLang });
       } else {
           // Re-throw other errors (e.g., video not found, captions disabled)
           throw e;
       }
    }
    
    const videoDetails = await getVideoDetails({ videoID: videoId });

    const formattedTranscript: TranscriptItem[] = (subtitles || []).map((item: Subtitle) => {
        const start = typeof item.start === 'string' ? parseFloat(item.start) : item.start;
        const dur = typeof item.dur === 'string' ? parseFloat(item.dur) : item.dur;
        return {
            text: item.text,
            offset: start * 1000, // Convert to milliseconds
            duration: dur * 1000, // Convert to milliseconds
        };
    });

    const result: ProcessVideoOutput = {
      title: videoDetails.title || `Video: ${videoId}`,
      description: videoDetails.description || 'No description available.',
      transcript: formattedTranscript,
      sourceLang: sourceLang,
    };
    
    return result;

  } catch (error: any) {
    console.error(`[process-video-flow] Failed to process video ${videoId}:`, error);
    // Throw a more generic error to the client
    throw new Error(`Failed to process the YouTube video. It may be unavailable or have captions disabled. (Details: ${error.message})`);
  }
}
