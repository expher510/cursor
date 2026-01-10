
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript
 * using the OpenRouter API.
 *
 * - generateQuizFromTranscript - A function that creates quiz questions.
 * - GenerateQuizInput - The input type for the function.
 * - GenerateQuizOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import 'dotenv/config';

// Schema for a single quiz question
const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('An array of 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options array.'),
});

// Input schema for the flow
const GenerateQuizInputSchema = z.object({
  transcript: z.string().describe('The full transcript of the video.'),
  targetLanguage: z.string().describe('The language the user is learning (e.g., "Spanish", "Arabic").'),
  proficiencyLevel: z.string().describe('The user\'s proficiency level (e.g., "beginner", "intermediate", "advanced").'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Output schema for the flow
const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated list of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// This is the public wrapper function that components will call.
export async function generateQuizFromTranscript(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}


// The Main Genkit Flow
const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFromTranscriptFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ transcript, targetLanguage, proficiencyLevel }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
    }

    const prompt = `
      You are an expert language teacher. Your task is to create a comprehension quiz based on a video transcript.
      The user is a ${proficiencyLevel} learner of ${targetLanguage}.
      
      Create a quiz with exactly 7 questions that are appropriate for a ${proficiencyLevel} level.
      The questions should be a mix of multiple-choice and true/false to test understanding of the transcript.
      
      Here are the rules for the output:
      1. Provide the output as a SINGLE, VALID JSON object.
      2. The JSON object must contain a single key "questions".
      3. The value of "questions" must be an array of question objects.
      4. Each question object must have three properties: "questionText", "options" (an array of 4 choices), and "correctAnswer".
      5. For true/false questions, the "options" array must be exactly ["True", "False"].

      Transcript:
      ---
      ${transcript.substring(0, 9000)}
      ---

      Return ONLY the JSON object. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
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
        console.error("OpenRouter API Error:", errorBody);
        throw new Error(`OpenRouter API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content in AI response.");
      }

      // Find the start and end of the JSON object
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error("Valid JSON object not found in AI response.");
      }
      
      const jsonString = content.substring(jsonStart, jsonEnd + 1);

      // The AI should return a JSON string, so we parse it.
      const parsedContent = JSON.parse(jsonString);

      // Validate the parsed content against our Zod schema.
      const validatedOutput = GenerateQuizOutputSchema.parse(parsedContent);

      return validatedOutput;

    } catch (e: any) {
      console.error("Failed to generate or parse quiz:", e);
      throw new Error(`Could not generate quiz. Original error: ${e.message}`);
    }
  }
);
