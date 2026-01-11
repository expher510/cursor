
'use server';
/**
 * @fileOverview A flow for translating words using the Groq API, considering the context of the sentence.
 *
 * - translateWord - A function that takes a word and its context and returns its translation.
 * - TranslateWordInput - The input type for the translateWord function.
 * - TranslateWordOutput - The return type for the translateWord function.
 */

import { z } from 'zod';
import { Groq } from 'groq-sdk';
import 'dotenv/config';

const groq = new Groq();

const TranslateWordInputSchema = z.object({
  word: z.string().describe('The word to translate.'),
  sourceLang: z.string().default('en').describe('The source language.'),
  targetLang: z.string().default('ar').describe('The target language.'),
  context: z.string().optional().describe('The sentence or context in which the word appears.'),
});
export type TranslateWordInput = z.infer<typeof TranslateWordInputSchema>;

const TranslateWordOutputSchema = z.object({
  translation: z.string().describe('The translated word.'),
});
export type TranslateWordOutput = z.infer<typeof TranslateWordOutputSchema>;


function buildPrompt(input: TranslateWordInput): string {
    return `
      Translate the single word "${input.word}" from ${input.sourceLang} to ${input.targetLang}.
      The word appears in the following context: "${input.context}".
      Return ONLY the single best translation for the word in the given context. Do not provide explanations or alternative translations.
    `;
}


export async function translateWord(input: TranslateWordInput): Promise<TranslateWordOutput> {
    const { word, sourceLang, targetLang } = TranslateWordInputSchema.parse(input);
    if (!word) {
        return { translation: '' };
    }

    const prompt = buildPrompt(input);

    try {
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "system",
                    "content": "You are a highly skilled polyglot translator. Your only task is to provide a single, context-aware translation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "model": "llama-3.1-8b-instant",
            "temperature": 0.1,
            "max_tokens": 60,
            "top_p": 1,
            "stream": false,
            "stop": null
        });

        const translation = chatCompletion.choices[0]?.message?.content?.replace(/["'.]/g, '').trim() || 'Translation failed';

        return {
          translation: translation,
        };

    } catch (error: any) {
        console.error("Groq translation flow failed:", error);
        throw new Error("Failed to get translation from AI service.");
    }
}
