
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript
 * using the built-in Genkit AI (Gemini).
 *
 * - generateQuizFromTranscript - A function that creates quiz questions.
 * - GenerateQuizInput - The input type for the function.
 * - GenerateQuizOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';

// Define the schema for a single quiz question
const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('An array of 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options array.'),
});

// Define the schema for the input of our flow
const GenerateQuizInputSchema = z.object({
  transcript: z.string().describe('The full transcript of the video.'),
  targetLanguage: z.string().describe('The language the user is learning (e.g., "Spanish", "Arabic").'),
  proficiencyLevel: z.string().describe('The user\'s proficiency level (e.g., "beginner", "intermediate", "advanced").'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Define the schema for the output of our flow, ensuring it's a JSON object with a "questions" array
const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated list of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// This is the public wrapper function that components will call.
export async function generateQuizFromTranscript(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFromTranscriptFlow(input);
}


// Define the prompt for the AI model
const quizPrompt = ai.definePrompt({
    name: 'quizGenerationPrompt',
    model: 'gemini-1.5-flash',
    input: { schema: GenerateQuizInputSchema },
    output: { schema: GenerateQuizOutputSchema }, // Ensure the output is in the correct JSON format
    prompt: `
      You are an expert language teacher. Your task is to create a quick comprehension quiz based on a snippet from a video transcript.
      The user is a {{proficiencyLevel}} learner of {{targetLanguage}}.
      
      Create a quiz with exactly 3 questions that are appropriate for a {{proficiencyLevel}} level.
      The questions should test understanding of the provided transcript snippet.
      
      Here are the rules for the output:
      1. Your entire response MUST be a single, valid JSON object.
      2. The JSON object must contain a single key "questions".
      3. The value of "questions" must be an array of 3 question objects.
      4. Each question object must have three properties: "questionText", "options" (an array of 4 choices), and "correctAnswer".
      5. The language of "questionText", "options", and "correctAnswer" MUST be in {{targetLanguage}}.

      Transcript Snippet:
      ---
      {{transcript}}
      ---

      Return ONLY the JSON object. Do not include any other text, explanations, or markdown formatting.
    `,
});


// The Main Genkit Flow
const generateQuizFromTranscriptFlow = ai.defineFlow(
  {
    name: 'generateQuizFromTranscriptFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    try {
        // Take a random snippet of the transcript to keep the prompt size reasonable
        const snippet = input.transcript.substring(0, 4000);
        
        const { output } = await quizPrompt({
            ...input,
            transcript: snippet,
        });

        if (!output) {
            throw new Error("AI model returned an empty response.");
        }
        
        return output;

    } catch (error) {
        console.error("Error generating quiz with Genkit/Gemini:", error);
        if (error instanceof z.ZodError) {
             throw new Error(`AI returned data in an unexpected format. Details: ${error.message}`);
        }
        // Throw a generic error to be caught by the UI
        throw new Error("Failed to generate quiz. Please try again later.");
    }
  }
);

    