
'use server';
/**
 * @fileOverview A flow for generating feedback on a user's speech from a recording.
 *
 * - generateSpeechFeedback - A function that analyzes user audio and provides feedback.
 * - GenerateSpeechFeedbackInput - The input type for the function.
 * - GenerateSpeechFeedbackOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// Input schema for the flow
const GenerateSpeechFeedbackInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The user's recorded audio, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  originalText: z.string().describe("The original transcript text the user was supposed to say."),
  targetLanguage: z.string().describe("The language the user is learning (e.g., 'Arabic', 'Spanish').")
});
export type GenerateSpeechFeedbackInput = z.infer<typeof GenerateSpeechFeedbackInputSchema>;

// Output schema for the flow
const GenerateSpeechFeedbackOutputSchema = z.object({
  transcribedText: z.string().describe("The text transcribed from the user's audio."),
  accuracy: z.string().describe("Feedback on the accuracy of the words spoken compared to the original text."),
  fluency: z.string().describe("Feedback on the fluency, rhythm, and pauses."),
  pronunciation: z.string().describe("Feedback on the pronunciation of the words and sounds."),
});
export type GenerateSpeechFeedbackOutput = z.infer<typeof GenerateSpeechFeedbackOutputSchema>;


// This is the public wrapper function that components will call.
export async function generateSpeechFeedback(input: GenerateSpeechFeedbackInput): Promise<GenerateSpeechFeedbackOutput> {
  return generateSpeechFeedbackFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateSpeechFeedbackPrompt',
    input: { schema: GenerateSpeechFeedbackInputSchema },
    output: { schema: GenerateSpeechFeedbackOutputSchema },
    model: googleAI('gemini-1.5-flash'),
    prompt: `You are a language coach for a student learning ${'{{{targetLanguage}}}'}.
    The user was asked to say the following text:
    ---
    Original Text: {{{originalText}}}
    ---

    They provided an audio recording of them speaking. I have transcribed their audio for you.
    Your task is to analyze their speech and provide feedback.

    Here is the transcription of what the user actually said:
    ---
    Transcription: {{media url=audioDataUri}}
    ---
    
    Based on this, evaluate the user's performance and provide feedback on three aspects:
    1.  **Accuracy**: Compare the transcribed text to the original text. Point out any missed or incorrect words.
    2.  **Fluency**: Comment on the rhythm, flow, and use of pauses. Was it natural or hesitant?
    3.  **Pronunciation**: Based on the transcription, identify any potential pronunciation mistakes. Be encouraging.

    Provide your response ONLY as a valid JSON object with the keys "transcribedText", "accuracy", "fluency", and "pronunciation".
    `
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
        const { output } = await prompt(input);
        if (!output) {
            throw new Error("AI did not return any output.");
        }
        return output;

    } catch (e: any) {
      console.error("Failed to generate speech feedback:", e);
      throw new Error(`Could not generate feedback. Original error: ${e.message}`);
    }
  }
);
