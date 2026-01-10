
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
    
    const openRouterKey = process.env.OPENROUTER_API_KEY;
     if (!openRouterKey) {
      throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
    }

    try {
        // Step 1: Transcribe the audio using AssemblyAI
        const assemblyClient = new AssemblyAI({ apiKey: assemblyAiKey });
        const transcript = await assemblyClient.transcripts.transcribe({
            audio: audioDataUri,
        });

        if (!transcript.text) {
            throw new Error("AssemblyAI failed to transcribe the audio.");
        }
        
        const transcribedText = transcript.text;

        // Step 2: Get feedback on the transcription using OpenRouter
        const prompt = `
            You are a language coach for a student learning ${targetLanguage}.
            The student's native language is ${nativeLanguage}.
            
            The user was asked to say the following text:
            ---
            Original Text: ${originalText}
            ---

            The user's speech was transcribed as:
            ---
            Transcribed Text: ${transcribedText}
            ---

            Your tasks are to analyze the transcribed speech and provide feedback in the user's NATIVE language (${nativeLanguage}).

            Your analysis should cover three aspects:
            1.  **Accuracy**: Compare the transcribed text to the original text. Point out any missed, extra, or incorrect words. Be specific.
            2.  **Fluency**: Based on the transcription, comment on the likely fluency. Does it seem like they spoke naturally or hesitated?
            3.  **Pronunciation**: Based on the transcription (e.g., if a word was transcribed as a different but similarly sounding word), identify potential pronunciation mistakes. Be encouraging.

            Provide your response ONLY as a valid JSON object with three keys: "accuracy", "fluency", and "pronunciation".
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-flash-1.5", 
                messages: [{ "role": "user", "content": prompt }],
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenRouter API request failed: ${errorBody}`);
        }
        
        const result = await response.json();
        const content = result.choices[0]?.message?.content;

        if (!content) {
            throw new Error("AI feedback generation failed.");
        }
        
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        const jsonString = content.substring(jsonStart, jsonEnd + 1);
        const feedback = JSON.parse(jsonString);

        return {
            transcribedText: transcribedText,
            accuracy: feedback.accuracy,
            fluency: feedback.fluency,
            pronunciation: feedback.pronunciation,
        };

    } catch (e: any) {
      console.error("Failed to generate or parse speech feedback:", e);
      throw new Error(`Could not generate feedback. Original error: ${e.message}`);
    }
  }
);
