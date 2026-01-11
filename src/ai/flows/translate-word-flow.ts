
'use server';
/**
 * @fileOverview A flow for translating words using the MyMemory API.
 *
 * - translateWord - A function that takes a word and returns its translation.
 * - TranslateWordInput - The input type for the translateWord function.
 * - TranslateWordOutput - The return type for the translateWord function.
 */

import { z } from 'zod';

const TranslateWordInputSchema = z.object({
  word: z.string().describe('The word to translate.'),
  sourceLang: z.string().default('en').describe('The source language.'),
  targetLang: z.string().default('ar').describe('The target language.'),
});
export type TranslateWordInput = z.infer<typeof TranslateWordInputSchema>;

const TranslateWordOutputSchema = z.object({
  translation: z.string().describe('The translated word.'),
});
export type TranslateWordOutput = z.infer<typeof TranslateWordOutputSchema>;

export async function translateWord(input: TranslateWordInput): Promise<TranslateWordOutput> {
    const { word, sourceLang, targetLang } = TranslateWordInputSchema.parse(input);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${sourceLang}|${targetLang}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`MyMemory API request failed with status ${response.status}`);
      }
      const data = await response.json();
      
      if (data.responseData) {
        return {
          translation: data.responseData.translatedText,
        };
      } else {
        throw new Error('Invalid response structure from MyMemory API');
      }
    } catch (error: any) {
        console.error("Translation flow failed:", error);
        // Re-throw the error to ensure the server action fails clearly
        throw error;
    }
}
