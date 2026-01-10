
'use server';
/**
 * @fileOverview A flow for generating feedback on a user's writing exercise.
 *
 * - generateWritingFeedback - A function that analyzes user text and provides feedback.
 * - GenerateWritingFeedbackInput - The input type for the function.
 * - GenerateWritingFeedbackOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';

// Input schema for the flow
const GenerateWritingFeedbackInputSchema = z.object({
  writingText: z.string().describe("The text written by the user."),
  usedWords: z.array(z.string()).describe("The list of words the user was prompted to use."),
  targetLanguage: z.string().describe("The language the user is learning."),
  nativeLanguage: z.string().describe("The user's native language."),
  proficiencyLevel: z.string().describe("The user's proficiency level."),
});
export type GenerateWritingFeedbackInput = z.infer<typeof GenerateWritingFeedbackInputSchema>;

// Output schema for the flow
const GenerateWritingFeedbackOutputSchema = z.object({
    feedback: z.string().describe("Overall constructive feedback on the writing, in markdown format."),
    score: z.number().min(0).max(100).describe("A score from 0 to 100 representing the quality of the writing."),
    suggestions: z.array(z.string()).describe("A list of specific suggestions for improvement."),
});
export type GenerateWritingFeedbackOutput = z.infer<typeof GenerateWritingFeedbackOutputSchema>;


// This is the public wrapper function that components will call.
export async function generateWritingFeedback(input: GenerateWritingFeedbackInput): Promise<GenerateWritingFeedbackOutput> {
  return generateWritingFeedbackFlow(input);
}


const feedbackPrompt = ai.definePrompt({
    name: 'writingFeedbackPrompt',
    model: 'gemini-1.5-flash',
    input: { schema: GenerateWritingFeedbackInputSchema },
    output: { schema: GenerateWritingFeedbackOutputSchema },
    prompt: `
        You are an expert teacher of the ${'{{targetLanguage}}'} language.
        I am a student at the '${'{{proficiencyLevel}}'} level, and my native language is ${'{{nativeLanguage}}'}.

        I was asked to write a text in ${'{{targetLanguage}}'} using the following words: [${'{{usedWords}}'}].

        This is my text:
        ---
        ${'{{writingText}}'}
        ---

        I want your feedback and a comprehensive evaluation of this text.
        Your entire output, including feedback and suggestions, must be in my NATIVE language (${'{{nativeLanguage}}'}).

        Provide the output ONLY as a valid JSON object with three keys: "feedback", "score", and "suggestions".
        - "feedback": Provide a comprehensive evaluation of my text, covering grammar, correct use of the provided words, and overall coherence.
        - "score": Give a score from 0 to 100.
        - "suggestions": Provide a list of 2-3 specific, actionable suggestions for improvement.
    `,
});


// The Main Genkit Flow
const generateWritingFeedbackFlow = ai.defineFlow(
  {
    name: 'generateWritingFeedbackFlow',
    inputSchema: GenerateWritingFeedbackInputSchema,
    outputSchema: GenerateWritingFeedbackOutputSchema,
  },
  async (input) => {
    try {
        const { output } = await feedbackPrompt(input);
        if (!output) {
            throw new Error("AI failed to generate writing feedback.");
        }
        return output;

    } catch (e: any) {
      console.error("Failed to generate or parse writing feedback:", e);
      throw new Error(`Could not generate feedback. Original error: ${e.message}`);
    }
  }
);
