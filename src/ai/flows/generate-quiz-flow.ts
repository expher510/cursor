'use server';
/**
 * @fileOverview A flow for programmatically generating a multiple-choice quiz
 * from a video transcript and a vocabulary list.
 *
 * - generateQuiz - A function that creates quiz questions.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { translateWord } from './translate-word-flow';

// Utility function to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


// Schema Definitions
const VocabularyItemSchema = z.object({
    word: z.string(),
    translation: z.string(),
});

const GenerateQuizInputSchema = z.object({
  transcript: z.string().describe("The full transcript of the video."),
  vocabulary: z.array(VocabularyItemSchema).describe("A list of vocabulary words from the video to create questions for."),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;


const QuizQuestionSchema = z.object({
  questionText: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated list of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// This is the public wrapper function that components will call.
export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}


// The Main Flow
const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ transcript, vocabulary }) => {
    
    const questions = [];

    // Ensure we have words to choose from for distractors
    const allWordsInTranscript = Array.from(
        new Set(transcript.toLowerCase().match(/\b([a-zA-Z]{3,})\b/g) || [])
    );

    if (vocabulary.length < 4) {
        console.warn("Not enough vocabulary words to generate a meaningful quiz. Need at least 4.");
        // We can create a simple question from the transcript if vocab is insufficient
        if (allWordsInTranscript.length > 4) {
            const randomWords = shuffleArray(allWordsInTranscript).slice(0, 4);
            const correctWord = randomWords[0];
            const { translation } = await translateWord({ word: correctWord, sourceLang: 'en', targetLang: 'ar' });
            
            questions.push({
                questionText: `What is the meaning of "${correctWord}"?`,
                options: shuffleArray(randomWords.map(w => w)),
                correctAnswer: correctWord,
            });

             return { questions };
        }
        return { questions: [] }; // Not enough words at all
    }


    for (const item of vocabulary) {
        // 1. Define the correct answer
        const { translation: correctAnswer } = await translateWord({ word: item.word, sourceLang: 'en', targetLang: 'ar' });

        // 2. Find distractors (other words from the vocab list)
        const distractors = vocabulary
            .filter(v => v.word !== item.word) // Exclude the correct word
            
        const shuffledDistractors = shuffleArray(distractors);

        // 3. Get translations for the distractors
        const distractorOptions = await Promise.all(
            shuffledDistractors.slice(0, 3).map(async d => {
                const { translation } = await translateWord({ word: d.word, sourceLang: 'en', targetLang: 'ar' });
                return translation;
            })
        );
        
        // 4. Combine and shuffle options
        const options = shuffleArray([correctAnswer, ...distractorOptions]);

        // 5. Create the question object
        questions.push({
            questionText: `What is the Arabic translation of the word "${item.word}"?`,
            options: options,
            correctAnswer: correctAnswer,
        });
    }

    return { questions };
  }
);
