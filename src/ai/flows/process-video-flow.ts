
'use server';
/**
 * @fileOverview A flow for processing YouTube videos to extract transcripts, title, and description
 * using the `youtube-caption-extractor` library.
 *
 * - processVideo - A function that takes a YouTube video ID and returns its details.
 * - ProcessVideoInput - The input type for the processVideo function.
 * - ProcessVideoOutput - The return type for the processVideo function.
 */

import { z } from 'zod';
import { getVideoDetails, getSubtitles, type Subtitle } from 'youtube-caption-extractor';


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
  title: z.string().describe('The title of the YouTube video.'),
  description: z.string().describe('The description of the YouTube video.'),
  transcript: z.array(TranscriptItemSchema).describe('The transcript of the video with timestamps.'),
  sourceLang: z.string().describe('The language code of the fetched transcript.'),
});
export type ProcessVideoOutput = z.infer<typeof ProcessVideoOutputSchema>;

/**
 * معالجة فيديو يوتيوب لاستخراج النص والعنوان والوصف
 * 
 * @param input - كائن يحتوي على معرف الفيديو ورمز اللغة الاختياري
 * @returns {Promise<ProcessVideoOutput>} تفاصيل الفيديو بما في ذلك العنوان والوصف والنص مع الأوقات
 * @throws {Error} إذا لم يكن للفيديو ترجمة أو فشلت المعالجة
 */
export async function processVideo(input: ProcessVideoInput): Promise<ProcessVideoOutput> {
    const { videoId, lang } = ProcessVideoInputSchema.parse(input);
    try {
        // Fetch subtitles and video details in parallel for efficiency
        const [subtitles, videoDetails] = await Promise.all([
            getSubtitles({ videoID: videoId, lang }),
            getVideoDetails({ videoID: videoId })
        ]);

        const formattedTranscript: TranscriptItem[] = (subtitles || []).map((item: Subtitle) => {
            const start = typeof item.start === 'string' ? parseFloat(item.start) : item.start;
            const dur = typeof item.dur === 'string' ? parseFloat(item.dur) : item.dur;
    
            return {
                text: item.text,
                offset: start * 1000,
                duration: dur * 1000,
            };
        });

        if (formattedTranscript.length === 0) {
             console.warn(`[LinguaStream] No transcript found for video ${videoId} in language ${lang}.`);
             // We throw here to allow fallback logic to trigger
             throw new Error(`No transcript available for the requested language (${lang}).`);
        }
        
        const result = {
            title: videoDetails.title || `Video: ${videoId}`,
            description: videoDetails.description || 'No description available.',
            transcript: formattedTranscript,
            sourceLang: lang,
        };

        return ProcessVideoOutputSchema.parse(result);

    } catch (e: any) {
         console.error("Failed to process video:", e.message);
         if (e.message.includes('Transcript is disabled')) {
             throw new Error(`This video does not have captions enabled, so a transcript cannot be created. Please try a different video.`);
         }
         if (e.message.includes('Could not find transcript for this video')) {
             throw new Error(`No transcript available for the requested language (${lang}). Please try another video.`);
         }
         // Re-throw the original error if it's not one of the specific cases above
         throw e;
    }
}
