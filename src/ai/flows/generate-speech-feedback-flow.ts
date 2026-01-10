
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
  transcribedText: z.string().describe("The text transcribed from the user's audio."),
  originalText: z.string().describe("The original transcript text the user was supposed to say."),
  targetLanguage: z.string().describe("The language the user is learning (e.g., 'Arabic', 'Spanish').")
});
export type GenerateSpeechFeedbackInput = z.infer<typeof GenerateSpeechFeedbackInputSchema>;

// Output schema for the flow
const GenerateSpeechFeedbackOutputSchema = z.object({
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
  async ({ transcribedText, originalText, targetLanguage }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
    }
    
    const prompt = `
        You are a language coach for a student learning ${targetLanguage}.
        The user was asked to say the following text:
        ---
        Original Text: ${originalText}
        ---

        The user provided an audio recording, and this is the transcription of what they actually said:
        ---
        Transcription: ${transcribedText}
        ---
        
        Your task is to analyze their speech based on the transcription and provide feedback.
        
        Evaluate the user's performance on three aspects:
        1.  **Accuracy**: Compare the transcribed text to the original text. Point out any missed, extra, or incorrect words. Be specific.
        2.  **Fluency**: Based on the transcription, comment on the likely fluency. Does it seem like they spoke naturally or hesitated (e.g., if there are filler words or unnatural phrasing)?
        3.  **Pronunciation**: Based on the transcription (e.g., if a word was transcribed as a different but similarly sounding word), identify potential pronunciation mistakes. Be encouraging.

        Provide your response ONLY as a valid JSON object with the keys "accuracy", "fluency", and "pronunciation".
        Do not include any other text, explanations, or markdown formatting like \`\`\`json.
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "google/gemma-3n-e2b-it:free",
              messages: [
                { "role": "user", "content": prompt }
              ],
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("OpenRouter API Error for speech feedback:", errorBody);
            throw new Error(`OpenRouter API request failed with status ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices[0]?.message?.content;
      
        if (!content) {
            throw new Error("No content in AI response.");
        }

        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');

        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("Valid JSON object not found in AI response.");
        }
      
        const jsonString = content.substring(jsonStart, jsonEnd + 1);
        const parsedContent = JSON.parse(jsonString);

        return GenerateSpeechFeedbackOutputSchema.parse(parsedContent);

    } catch (e: any) {
      console.error("Failed to generate or parse speech feedback:", e);
      throw new Error(`Could not generate feedback. Original error: ${e.message}`);
    }
  }
);

    