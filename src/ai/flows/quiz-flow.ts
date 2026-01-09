
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript.
 *
 * - generateQuiz - A function that takes a video transcript and returns a validated set of quiz questions.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { QuizInputSchema, QuizOutputSchema, type QuizInput, type QuizOutput } from '@/ai/schemas/quiz-schema';
import 'dotenv/config';
import { z } from 'zod';

// This is a wrapper function that we will call from our components.
export async function generateQuiz(input: QuizInput): Promise<QuizOutput> {
  // 1. Call the underlying flow to get the raw JSON output from the AI.
  const rawQuizData = await generateQuizFlow(input);

  // 2. Parse and validate the raw data against our strict application schema.
  const validationResult = QuizOutputSchema.safeParse(rawQuizData);

  if (!validationResult.success) {
    console.error("AI returned data in an unexpected format:", validationResult.error);
    throw new Error("The AI generated a quiz in an invalid format. Please try again.");
  }
  
  return validationResult.data;
}

const quizGenerationPrompt = ai.definePrompt(
  {
    name: 'quizGenerationPrompt',
    input: { schema: QuizInputSchema },
    output: { schema: z.any() }, // The prompt's direct output is raw, unvalidated JSON
    model: googleAI.model('gemini-pro'),
    config: {
      temperature: 0.5,
    },
    prompt: `
        You are an AI assistant designed to create educational content.
        Your task is to generate a multiple-choice quiz based on the provided video transcript.

        Please adhere to the following instructions:
        1.  Generate exactly 5 multiple-choice questions.
        2.  Each question must have exactly 4 possible answers.
        3.  Only one answer per question can be correct.
        4.  The questions should test comprehension of the main topics in the transcript, not just simple word recall.
        5.  The entire output must be a valid JSON object that conforms to the provided schema. Do not include any extra text, explanations, or markdown.

        Here is the transcript:
        ---
        {{{transcript}}}
        ---
    `,
  }
);


const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: QuizInputSchema,
    // The flow's output is the raw, unvalidated object from the AI.
    outputSchema: z.any(),
  },
  async ({ transcript }) => {
    try {
        const llmResponse = await quizGenerationPrompt({ transcript });
        const generatedJson = llmResponse.output;

        if (!generatedJson) {
            throw new Error("The AI model did not return a valid JSON output. The content might be too short or unsuitable.");
        }

        // Return the raw, unvalidated JSON object. The wrapper will validate it.
        return generatedJson;

    } catch (error: any) {
      console.error("Error calling Genkit flow for quiz generation:", error);
      // Re-throw the original error if it's specific, or a generic one.
      throw new Error(error.message || "Failed to generate quiz from Genkit flow.");
    }
  }
);
