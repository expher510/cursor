
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript.
 * This file demonstrates a separation of concerns:
 * 1. The AI's job is to generate a raw, structured JSON object.
 * 2. The application's job is to parse and validate that JSON into a strict, type-safe object.
 *
 * - generateQuiz - A function that takes a video transcript and returns a validated set of quiz questions.
 */

import { ai } from '@/ai/genkit';
import { QuizInputSchema, QuizOutputSchema, type QuizInput, type QuizOutput } from '@/ai/schemas/quiz-schema';
import 'dotenv/config';
import { z } from 'zod';

// This is a wrapper function that we will call from our components.
export async function generateQuiz(input: QuizInput): Promise<QuizOutput> {
  // 1. Call the underlying flow to get the raw JSON output from the AI.
  const rawQuizData = await generateQuizFlow(input);

  // 2. Parse and validate the raw data against our strict application schema.
  // This ensures the data is safe and in the expected format before being used.
  // This is the "application-side" logic.
  const validationResult = QuizOutputSchema.safeParse(rawQuizData);

  if (!validationResult.success) {
    console.error("AI returned data in an unexpected format:", validationResult.error);
    throw new Error("The AI generated a quiz in an invalid format. Please try again.");
  }
  
  return validationResult.data;
}

// Intermediate schema for what we ask the AI to generate.
// This can be slightly looser than our final application schema.
const GeminiQuizOutputSchema = z.object({
  questions: z.array(z.object({
    questionText: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
  })),
});


const quizGenerationPrompt = ai.definePrompt({
    name: 'quizGenerationPrompt',
    input: { schema: QuizInputSchema },
    // We tell the AI to generate JSON that loosely matches this shape.
    output: { format: 'json', schema: GeminiQuizOutputSchema },
    model: 'gemini-pro',
    prompt: `
        You are an AI assistant designed to create educational content.
        Your task is to generate a multiple-choice quiz based on the provided video transcript.

        Please adhere to the following instructions:
        1.  Generate exactly 5 multiple-choice questions.
        2.  Each question must have exactly 4 possible answers.
        3.  Only one answer per question can be correct.
        4.  The questions should test comprehension of the main topics in the transcript, not just simple word recall.
        5.  The entire output must be a valid JSON object. Do not include any extra text, explanations, or markdown.

        Here is the transcript:
        ---
        {{{transcript}}}
        ---
    `,
    config: {
        safetySettings: [
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_ONLY_HIGH',
            },
             {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_ONLY_HIGH',
            },
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_ONLY_HIGH',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_ONLY_HIGH',
            },
        ],
    },
});


const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: QuizInputSchema,
    // The flow's output is the raw, unvalidated object from the AI.
    outputSchema: z.any(),
  },
  async (input) => {
    
    try {
        // This is the direct call to the AI model via the prompt.
        // It uses the "GoogleGenAI" library under the hood.
        const response = await quizGenerationPrompt(input);
        const output = response.output;
        
        if (!output) {
            const finishReason = response.candidates[0]?.finishReason;
            if (finishReason === 'SAFETY') {
                 throw new Error("The AI blocked quiz generation due to safety policies. The video content may be too sensitive.");
            }
             throw new Error("The AI model did not return a valid output. The content might be too short.");
        }

        // Return the raw, unvalidated JSON object.
        return output;

    } catch (error: any) {
      console.error("Error calling Gemini API for quiz generation:", error);
      // Re-throw the original error if it's specific, or the generic one.
      throw new Error(error.message || "Failed to generate quiz from Gemini API.");
    }
  }
);

