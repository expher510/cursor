
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript.
 *
 * - generateQuiz - A function that takes a video transcript and returns a set of quiz questions.
 */

import { ai } from '@/ai/genkit';
import { QuizInputSchema, QuizOutputSchema, type QuizInput, type QuizOutput } from '@/ai/schemas/quiz-schema';
import 'dotenv/config';

// This is a wrapper function that we will call from our components.
export async function generateQuiz(input: QuizInput): Promise<QuizOutput> {
  return generateQuizFlow(input);
}

const quizGenerationPrompt = ai.definePrompt({
    name: 'quizGenerationPrompt',
    input: { schema: QuizInputSchema },
    output: { schema: QuizOutputSchema },
    prompt: `
        You are an AI assistant designed to create educational content.
        Your task is to generate a multiple-choice quiz based on the provided video transcript.

        Please adhere to the following instructions:
        1.  Generate exactly 5 multiple-choice questions.
        2.  Each question must have exactly 4 possible answers.
        3.  Only one answer per question can be correct.
        4.  The questions should test comprehension of the main topics in the transcript, not just simple word recall.
        5.  The entire output must be a valid JSON object, conforming to the specified output schema. Do not include any extra text, explanations, or markdown.

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
        ],
    },
});


const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: QuizInputSchema,
    outputSchema: QuizOutputSchema,
  },
  async (input) => {
    
    try {
        const { output } = await quizGenerationPrompt(input);
        
        if (!output) {
            throw new Error("The AI model did not return any output.");
        }

        return output;

    } catch (error) {
      console.error("Error calling Gemini API for quiz generation:", error);
      throw new Error("Failed to generate quiz from Gemini API.");
    }
  }
);
