
'use server';
/**
 * @fileOverview A flow for programmatically generating a multiple-choice quiz
 * from a video transcript and a vocabulary list. It creates two types of questions:
 * 1. Vocabulary questions based on saved words.
 * 2. Fill-in-the-blank questions based on the video transcript.
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
  transcript: z.string().describe('The full transcript of the video.'),
  vocabulary: z
    .array(VocabularyItemSchema)
    .describe('A list of vocabulary words from the video to create questions for.'),
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
export async function generateQuiz(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}


// Function to create vocabulary-based questions
async function createVocabularyQuestions(vocabulary: z.infer<typeof VocabularyItemSchema>[]) {
    const questions = [];
    if (vocabulary.length < 4) {
        console.warn("Not enough vocabulary words to generate vocabulary questions. Need at least 4.");
        return [];
    }

    for (const item of vocabulary) {
        // 1. Define the correct answer (the translation)
        const { translation: correctAnswer } = await translateWord({ word: item.word, sourceLang: 'en', targetLang: 'ar' });
        if (!correctAnswer) continue;

        // 2. Find distractors (translations of other words from the vocab list)
        const distractors = vocabulary.filter(v => v.word !== item.word);
        const shuffledDistractors = shuffleArray(distractors);

        // 3. Get translations for the distractors
        const distractorOptions = (await Promise.all(
            shuffledDistractors.slice(0, 3).map(async d => {
                const { translation } = await translateWord({ word: d.word, sourceLang: 'en', targetLang: 'ar' });
                return translation;
            })
        )).filter(t => t); // Filter out any failed translations

        if (distractorOptions.length < 3) continue; // Skip if we couldn't get enough distractors

        // 4. Combine and shuffle options
        const options = shuffleArray([correctAnswer, ...distractorOptions]);

        // 5. Create the question object
        questions.push({
            questionText: `What is the Arabic translation of the word "${item.word}"?`,
            options: options,
            correctAnswer: correctAnswer,
        });
    }
    return questions;
}

// Function to create fill-in-the-blank questions from the transcript
function createFillInTheBlankQuestions(transcript: string, count: number) {
    const questions = [];
    const sentences = transcript.split(/[.?!]/).filter(s => s.trim().length > 10);
    const allWords = Array.from(new Set(transcript.toLowerCase().match(/\b([a-zA-Z]{4,})\b/g) || []));

    if (sentences.length < count || allWords.length < 4) {
        console.warn("Not enough sentences or unique words in transcript to generate fill-in-the-blank questions.");
        return [];
    }
    
    const shuffledSentences = shuffleArray(sentences).slice(0, count);

    for (const sentence of shuffledSentences) {
        const wordsInSentence = sentence.trim().split(/\s+/);
        // Find a word to remove that is suitably long
        const candidateWords = wordsInSentence.filter(w => w.length > 3);
        if (candidateWords.length === 0) continue;
        
        const wordToRemove = shuffleArray(candidateWords)[0];
        const correctAnswer = wordToRemove.replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");

        const questionText = sentence.replace(wordToRemove, '_______');

        // Get distractors from the general word bank
        const distractors = shuffleArray(allWords.filter(w => w.toLowerCase() !== correctAnswer.toLowerCase())).slice(0, 3);
        if (distractors.length < 3) continue;

        const options = shuffleArray([correctAnswer, ...distractors]);

        questions.push({
            questionText,
            options,
            correctAnswer,
        });
    }

    return questions;
}


// The Main Flow
const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ transcript, vocabulary }) => {
    
    // Generate both types of questions in parallel
    const [vocabQuestions, fillInBlankQuestions] = await Promise.all([
        createVocabularyQuestions(vocabulary),
        createFillInTheBlankQuestions(transcript, 7) // Generate 7 fill-in-the-blank questions
    ]);

    // Combine and shuffle all questions
    const allQuestions = shuffleArray([...vocabQuestions, ...fillInBlankQuestions]);
    
    return { questions: allQuestions };
  }
);
