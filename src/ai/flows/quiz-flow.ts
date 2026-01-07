
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript.
 *
 * - generateQuiz - A function that takes a video transcript and returns a set of quiz questions.
 */

import { ai } from '@/ai/genkit';
import { Groq } from "groq-sdk";
import { QuizInputSchema, QuizOutputSchema, type QuizInput, type QuizOutput } from '@/ai/schemas/quiz-schema';
import 'dotenv/config';


// This is a wrapper function that we will call from our components.
export async function generateQuiz(input: QuizInput): Promise<QuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: QuizInputSchema,
    outputSchema: QuizOutputSchema,
  },
  async (input) => {
    
    // --- Step 1: Define the prompt for Groq ---
    const groqPrompt = `
      You are an AI assistant designed to help language learners test their comprehension.
      Your task is to create a multiple-choice quiz based on the following video transcript.

      Generate 5 questions that cover the main points of the text.
      Each question must have exactly 4 possible answers, and only one of them should be correct.
      Ensure the questions are relevant to the content and test understanding, not just word recognition.

      Respond with ONLY a valid JSON object that strictly follows this Zod schema:
      
      \`\`\`json
      {
          "questions": [
              {
                  "questionText": "string",
                  "options": ["string", "string", "string", "string"],
                  "correctAnswer": "string"
              }
          ]
      }
      \`\`\`

      Here is the transcript:
      ---
      ${input.transcript}
      ---
    `;

    // --- Step 2: Make the API call to Groq ---
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not defined in your .env file.');
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    try {
      const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: groqPrompt }],
          model: 'llama3-8b-8192',
          temperature: 0.7,
          n: 1,
          stream: false,
          response_format: { type: "json_object" },
      });

      const content = JSON.parse(chatCompletion.choices[0].message.content || '{}');
      
      // Validate the response with Zod before returning
      const validatedOutput = QuizOutputSchema.parse(content);
      return validatedOutput;

    } catch (error) {
      console.error("Error calling Groq API:", error);
      throw new Error("Failed to generate quiz from Groq API.");
    }
  }
);
