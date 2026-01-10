
'use server';
/**
 * @fileOverview A flow for generating feedback on a user's speech from a recording.
 *
 * - generateSpeechFeedback - A function that analyzes user audio and provides feedback.
 * - GenerateSpeechFeedbackInput - The input type for the function.
 * - GenerateSpeechFeedbackOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';

// Input schema for the flow
const GenerateSpeechFeedbackInputSchema = z.object({
  audioDataUri: z.string().describe("A data URI of the user's audio recording. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  originalText: z.string().describe("The original transcript text the user was supposed to say."),
  targetLanguage: z.string().describe("The language the user is learning (e.g., 'Arabic', 'Spanish')."),
  nativeLanguage: z.string().describe("The user's native language to provide feedback in (e.g., 'English', 'Arabic').")
});
export type GenerateSpeechFeedbackInput = z.infer<typeof GenerateSpeechFeedbackInputSchema>;

// Output schema for the flow
const GenerateSpeechFeedbackOutputSchema = z.object({
  transcribedText: z.string().describe("The text transcribed from the user's audio."),
  accuracy: z.string().describe("Feedback on the accuracy of the words spoken compared to the original text."),
  fluency: z.string().describe("Feedback on the fluency, rhythm, and pauses based on the transcribed text."),
  pronunciation: z.string().describe("General feedback on potential pronunciation issues based on the transcribed text."),
});
export type GenerateSpeechFeedbackOutput = z.infer<typeof GenerateSpeechFeedbackOutputSchema>;


// This is the public wrapper function that components will call.
export async function generateSpeechFeedback(input: GenerateSpeechFeedbackInput): Promise<GenerateSpeechFeedbackOutput> {
  return generateSpeechFeedbackFlow(input);
}


const feedbackPrompt = ai.definePrompt({
    name: 'speechFeedbackPrompt',
    input: { schema: GenerateSpeechFeedbackInputSchema },
    output: { schema: GenerateSpeechFeedbackOutputSchema },
    prompt: `
        You are a language coach for a student learning ${'{{targetLanguage}}'}.
        The student's native language is ${'{{nativeLanguage}}'}.
        
        The user was asked to say the following text:
        ---
        Original Text: ${'{{originalText}}'}
        ---

        The user provided an audio recording of them speaking. Your tasks are:
        1. Transcribe the user's audio recording into text.
        2. Analyze their speech based on the transcription and the original text.
        3. Provide feedback in the user's NATIVE language (${'{{nativeLanguage}}'}).

        Your analysis should cover three aspects:
        1.  **Accuracy**: Compare the transcribed text to the original text. Point out any missed, extra, or incorrect words. Be specific.
        2.  **Fluency**: Based on the transcription, comment on the likely fluency. Does it seem like they spoke naturally or hesitated?
        3.  **Pronunciation**: Based on the transcription (e.g., if a word was transcribed as a different but similarly sounding word), identify potential pronunciation mistakes. Be encouraging.

        Here is the user's audio: {{media url=audioDataUri}}

        Provide your response ONLY as a valid JSON object.
        - The 'transcribedText' field should contain the English transcription of the audio.
        - The 'accuracy', 'fluency', and 'pronunciation' fields must be in the user's NATIVE language (${'{{nativeLanguage}}'}).
    `,
});


// The Main Genkit Flow
const generateSpeechFeedbackFlow = ai.defineFlow(
  {
    name: 'generateSpeechFeedbackFlow',
    inputSchema: GenerateSpeechFeedbackInputSchema,
    outputSchema: GenerateSpeechFeedbackOutputSchema,
  },
  async (input) => {
    
    try {
        const { output } = await feedbackPrompt(input);
        if (!output) {
            throw new Error("AI failed to generate feedback.");
        }
        return output;

    } catch (e: any) {
      console.error("Failed to generate or parse speech feedback:", e);
      throw new Error(`Could not generate feedback. Original error: ${e.message}`);
    }
  }
);
