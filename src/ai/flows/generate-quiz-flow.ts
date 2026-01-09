
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
        console.warn("Not enough vocabulary words to generate diverse vocabulary questions. Need at least 4 for good distractors.");
        // We can still proceed if there's at least one word.
    }

    const vocabWithTranslations = (await Promise.all(
        vocabulary.map(async (item) => {
            // Re-fetch translation to ensure it's correct and available.
            const { translation } = await translateWord({ word: item.word, sourceLang: 'en', targetLang: 'ar' });
            if (translation) {
                return { word: item.word, translation };
            }
            return null;
        })
    )).filter((item): item is { word: string; translation: string } => item !== null);


    if (vocabWithTranslations.length < 1) return [];

    for (const item of vocabWithTranslations) {
        const correctAnswer = item.translation;

        // Find distractors (translations of other words from the list)
        let distractorPool = vocabWithTranslations.filter(v => v.word !== item.word);
        
        // If the pool is too small, we can't get unique distractors.
        if (distractorPool.length < 3) {
           distractorPool = [...distractorPool, ...vocabWithTranslations.filter(v => v.word !== item.word)];
        }

        const shuffledDistractors = shuffleArray(distractorPool);
        const distractorOptions = shuffledDistractors.slice(0, 3).map(d => d.translation);

        if (distractorOptions.length < 3) continue; // Skip if we still couldn't get enough distractors

        // Combine and shuffle options
        const options = shuffleArray([correctAnswer, ...distractorOptions]);

        // Create the question object
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
    // Only use sentences that are between 5 and 30 words long for conciseness.
    const sentences = transcript.split(/[.?!]/).filter(s => {
        const wordCount = s.trim().split(/\s+/).length;
        return wordCount > 5 && wordCount < 30;
    });

    const allWords = Array.from(new Set(transcript.toLowerCase().match(/\b([a-zA-Z]{4,})\b/g) || []));

    if (sentences.length === 0 || allWords.length < 4) {
        console.warn("Not enough suitable sentences or unique words in transcript to generate fill-in-the-blank questions.");
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
        
        if (!correctAnswer) continue;

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
