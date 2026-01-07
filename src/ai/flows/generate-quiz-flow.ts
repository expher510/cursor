'use server';
/**
 * @fileOverview A flow for generating a quiz based on video transcript content.
 * 
 * - generateQuiz - A function that takes the video transcript and returns a comprehension quiz.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { groq } from '@genkit-ai/groq';

const TranscriptItemSchema = z.object({
  text: z.string(),
  offset: z.number(),
  duration: z.number(),
});

const GenerateQuizInputSchema = z.object({
  transcript: z.array(TranscriptItemSchema).describe('The full transcript of the video.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe("The quiz question, testing comprehension of the video content."),
    options: z.array(z.string()).length(4).describe("An array of 4 possible answers."),
    answer: z.string().describe("The correct answer based on the transcript."),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

const GenerateQuizOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}


const quizGenerationPrompt = ai.definePrompt(
    {
      name: 'quizGenerationPrompt',
      input: { schema: GenerateQuizInputSchema },
      output: { schema: GenerateQuizOutputSchema },
      prompt: `You are an expert in language education and content comprehension. Your task is to create a multiple-choice quiz based on the provided video transcript to test a user's understanding of the video's content.
  
      Generate 5 distinct comprehension questions. For each question:
      1.  The question should be about a key point, fact, or idea mentioned in the transcript.
      2.  Provide 4 multiple-choice options.
      3.  One of the options must be the correct answer, directly supported by the transcript content.
      4.  The other three options should be plausible but incorrect distractors. They can be related to the topic but not accurate according to the video. Do not repeat options for the same question.
      5.  Ensure the "answer" field in the output contains the correct answer.
      6.  The questions should cover different parts of the transcript, not just one section.
  
      Video Transcript:
      {{#each transcript}}
      - {{text}}
      {{/each}}
      `,
    },
);

const generateQuizFlow = ai.defineFlow(
    {
      name: 'generateQuizFlow',
      inputSchema: GenerateQuizInputSchema,
      outputSchema: GenerateQuizOutputSchema,
    },
    async (input) => {
        // Consolidate transcript text for a cleaner prompt
        const fullText = input.transcript.map(t => t.text).join(' ');

        const llmResponse = await ai.generate({
            model: groq('llama3-70b-8192'),
            prompt: await quizGenerationPrompt.render({ transcript: input.transcript }),
            output: {
                schema: GenerateQuizOutputSchema,
            },
            config: {
                temperature: 0.5,
            }
        });
  
      return llmResponse.output() ?? { quiz: [] };
    }
);
