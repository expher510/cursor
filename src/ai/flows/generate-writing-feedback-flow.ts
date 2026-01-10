
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


// The Main Genkit Flow
const generateWritingFeedbackFlow = ai.defineFlow(
  {
    name: 'generateWritingFeedbackFlow',
    inputSchema: GenerateWritingFeedbackInputSchema,
    outputSchema: GenerateWritingFeedbackOutputSchema,
  },
  async ({ writingText, usedWords, targetLanguage, nativeLanguage, proficiencyLevel }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
    }

    const prompt = `
      You are an expert ${targetLanguage} language teacher evaluating a writing sample from a student whose proficiency level is '${proficiencyLevel}'.
      The student's native language is ${nativeLanguage}.

      The student was asked to write a short text in ${targetLanguage} using the following words:
      [${usedWords.join(', ')}]

      Here is the student's writing sample:
      ---
      ${writingText}
      ---

      Your task is to provide feedback in a structured JSON format. The feedback ITSELF must be in the student's NATIVE language (${nativeLanguage}).
      
      Here are the rules for your evaluation:
      1.  **Feedback**: Write a concise, constructive paragraph of feedback in ${nativeLanguage}. Comment on grammar, vocabulary usage (did they use the words correctly?), and overall coherence. Keep the feedback encouraging.
      2.  **Score**: Give a score from 0 to 100.
      3.  **Suggestions**: Provide a list of 2-3 specific, actionable suggestions for improvement, also written in ${nativeLanguage}.

      Provide the output as a SINGLE, VALID JSON object with the keys "feedback", "score", and "suggestions".
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
      
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error("Valid JSON object not found in AI response.");
      }
      
      const jsonString = content.substring(jsonStart, jsonEnd + 1);
      const parsedContent = JSON.parse(jsonString);

      return GenerateWritingFeedbackOutputSchema.parse(parsedContent);

    } catch (e: any) {
      console.error("Failed to generate or parse writing feedback:", e);
      throw new Error(`Could not generate feedback. Original error: ${e.message}`);
    }
  }
);
