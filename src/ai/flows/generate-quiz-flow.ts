
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
    // Filter out numbers and words shorter than 4 characters
    const filteredVocabulary = vocabulary.filter(item => 
        item.word.length > 3 && isNaN(Number(item.word))
    );

    const questions = [];
    if (filteredVocabulary.length < 4) {
        console.warn("Not enough vocabulary words to generate diverse vocabulary questions. Need at least 4 for good distractors.");
    }

    const vocabWithTranslations = (await Promise.all(
        filteredVocabulary.map(async (item) => {
            if (item.translation && item.translation !== 'Translating...') {
                 const cleanedTranslation = item.translation.split(',')[0].trim();
                return { word: item.word, translation: cleanedTranslation };
            }
            try {
                const { translation } = await translateWord({ word: item.word, sourceLang: 'en', targetLang: 'ar' });
                if (translation) {
                    // Clean up the translation: take the first part if there are commas.
                    const cleanedTranslation = translation.split(',')[0].trim();
                    return { word: item.word, translation: cleanedTranslation };
                }
            } catch (e) {
                console.error(`Failed to translate word "${item.word}"`, e);
            }
            return null;
        })
    )).filter((item): item is { word: string; translation: string } => item !== null);


    if (vocabWithTranslations.length < 1) return [];

    for (const item of vocabWithTranslations) {
        const correctAnswer = item.translation;
        let distractorPool = vocabWithTranslations.filter(v => v.word !== item.word);
        
        if (distractorPool.length < 3) {
           distractorPool = [...distractorPool, ...vocabWithTranslations.filter(v => v.word !== item.word)];
        }

        const shuffledDistractors = shuffleArray(distractorPool);
        const distractorOptions = shuffledDistractors.slice(0, 3).map(d => d.translation);

        if (distractorOptions.length < 3) continue;

        const options = shuffleArray([correctAnswer, ...distractorOptions]);

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
    const usedWords = new Set<string>(); // Track words we've already used as blanks

    // Filter sentences: 5-30 words, and has at least one suitable content word.
    const sentences = transcript.split(/[.?!]/).filter(s => {
        const words = s.trim().split(/\s+/);
        return words.length >= 5 && words.length <= 30 &&
               words.some(w => /^[a-zA-Z]{4,}$/.test(w));
    });

    // Extract all unique, lowercased content words (4+ letters) from the entire transcript.
    const allWords = Array.from(new Set(
        transcript.toLowerCase().match(/\b[a-zA-Z]{4,}\b/g) || []
    ));
    
    if (sentences.length === 0 || allWords.length < 10) {
        console.warn("Insufficient content for fill-in-the-blank questions.");
        return [];
    }
    
    const shuffledSentences = shuffleArray([...sentences]);
    
    for (const sentence of shuffledSentences) {
        if (questions.length >= count) break;
        
        const wordsInSentence = sentence.trim().split(/\s+/);
        
        // Find candidate words in the sentence that are 5+ letters and haven't been used yet.
        const candidateWords = wordsInSentence
            .filter(w => /^[a-zA-Z]{5,}$/.test(w)) 
            .filter(w => !usedWords.has(w.toLowerCase()));
        
        if (candidateWords.length === 0) continue;
        
        const wordToRemove = candidateWords[0]; // Pick the first valid candidate
        const correctAnswer = wordToRemove.toLowerCase();
        
        usedWords.add(correctAnswer);
        
        // Create question with a blank, using a case-insensitive regex with word boundaries.
        const questionText = sentence
            .replace(new RegExp(`\\b${wordToRemove}\\b`, 'i'), '_______')
            .trim();
        
        // Get distractors that are contextually similar (similar length).
        const targetLength = correctAnswer.length;
        const distractors = shuffleArray(
            allWords.filter(w => 
                w !== correctAnswer &&
                Math.abs(w.length - targetLength) <= 2 &&
                !usedWords.has(w)
            )
        ).slice(0, 3);
        
        if (distractors.length < 3) {
            // If we can't find enough similar-length distractors, fall back to any random word.
            const fallbackDistractors = shuffleArray(allWords.filter(w => w !== correctAnswer)).slice(0, 3);
            if (fallbackDistractors.length < 3) continue; // Still not enough, skip.
            distractors.push(...fallbackDistractors.slice(0, 3 - distractors.length));
        };
        
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
    
    const [vocabQuestions, fillInBlankQuestions] = await Promise.all([
        createVocabularyQuestions(vocabulary),
        createFillInTheBlankQuestions(transcript, 7)
    ]);

    const allQuestions = shuffleArray([...vocabQuestions, ...fillInBlankQuestions]);
    
    return { questions: allQuestions };
  }
);

