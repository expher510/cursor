
'use server';
/**
 * @fileOverview A flow for generating feedback on a user's speech from a recording.
 * It first transcribes the audio using AssemblyAI, then sends the transcription
 * to an AI model for analysis and feedback.
 *
 * - generateSpeechFeedback - A function that analyzes user audio and provides feedback.
 * - GenerateSpeechFeedbackInput - The input type for the function.
 * - GenerateSpeechFeedbackOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';
import { AssemblyAI } from 'assemblyai';

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
  transcribedText: z.string().describe("The text transcribed from the user's audio by AssemblyAI."),
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
    model: 'gemini-1.5-flash',
    input: { schema: GenerateSpeechFeedbackInputSchema },
    output: { schema: z.object({
        accuracy: z.string(),
        fluency: z.string(),
        pronunciation: z.string(),
    })},
    prompt: `
        You are a language coach for a student learning ${'{{targetLanguage}}'}.
        The student's native language is ${'{{nativeLanguage}}'}.
        
        The user was asked to say the following text:
        ---
        Original Text: ${'{{originalText}}'}
        ---

        Here is the user's audio recording:
        ---
        Audio: {{media url=audioDataUri}}
        ---

        Your tasks are:
        1. Transcribe the audio recording.
        2. Compare your transcription to the "Original Text".
        3. Provide feedback on the user's performance in their NATIVE language (${'{{nativeLanguage}}'}).

        Your analysis should cover three aspects:
        1.  **Accuracy**: Compare the transcribed text to the original text. Point out any missed, extra, or incorrect words. Be specific.
        2.  **Fluency**: Based on the transcription and audio, comment on the likely fluency, rhythm, and pauses.
        3.  **Pronunciation**: Based on the transcription and audio (e.g., if a word sounds different), identify potential pronunciation mistakes. Be encouraging.

        Provide your response ONLY as a valid JSON object with three keys: "accuracy", "fluency", and "pronunciation". The entire response, including the content of these keys, MUST be in the user's native language: ${'{{nativeLanguage}}'}.
    `,
});


// The Main Genkit Flow
const generateSpeechFeedbackFlow = ai.defineFlow(
  {
    name: 'generateSpeechFeedbackFlow',
    inputSchema: GenerateSpeechFeedbackInputSchema,
    outputSchema: GenerateSpeechFeedbackOutputSchema,
  },
  async ({ audioDataUri, originalText, targetLanguage, nativeLanguage }) => {
    
    const assemblyAiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!assemblyAiKey) {
      throw new Error("ASSEMBLYAI_API_KEY is not defined in environment variables.");
    }
    
    try {
        // Step 1: Transcribe the audio using AssemblyAI for a baseline transcription
        const assemblyClient = new AssemblyAI({ apiKey: assemblyAiKey });
        const transcript = await assemblyClient.transcripts.transcribe({
            audio: audioDataUri,
        });

        if (!transcript.text) {
            throw new Error("AssemblyAI failed to transcribe the audio.");
        }
        
        const transcribedText = transcript.text;

        // Step 2: Get feedback from Gemini, providing it with the audio and text
        const { output } = await feedbackPrompt({
            audioDataUri,
            originalText,
            targetLanguage,
            nativeLanguage,
        });

        if (!output) {
            throw new Error("AI feedback generation failed.");
        }

        return {
            transcribedText: transcribedText, // Return the transcription from AssemblyAI
            accuracy: output.accuracy,
            fluency: output.fluency,
            pronunciation: output.pronunciation,
        };

    } catch (e: any) {
      console.error("Failed to generate or parse speech feedback:", e);
      throw new Error(`Could not generate feedback. Original error: ${e.message}`);
    }
  }
);
