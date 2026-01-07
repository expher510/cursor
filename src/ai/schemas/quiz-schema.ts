
import { z } from 'genkit';

export const QuestionSchema = z.object({
  questionText: z.string().describe('The text of the multiple-choice question.'),
  options: z.array(z.string()).length(4).describe('A list of exactly 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options list.'),
});

export const QuizInputSchema = z.object({
  transcript: z.string().describe('The full transcript of the video.'),
});

export const QuizOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('A list of generated quiz questions.'),
});

export type Question = z.infer<typeof QuestionSchema>;
export type QuizInput = z.infer<typeof QuizInputSchema>;
export type QuizOutput = z.infer<typeof QuizOutputSchema>;
