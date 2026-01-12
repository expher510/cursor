
'use server';
/**
 * @fileOverview A flow for translating words using the OpenAI API, considering the context of the sentence.
 *
 * - translateWord - A function that takes a word and its context and returns its translation.
 * - TranslateWordInput - The input type for the translateWord function.
 * - TranslateWordOutput - The return type for the translateWord function.
 */

import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI();

const TranslateWordInputSchema = z.object({
  word: z.string().describe('The word to translate.'),
  sourceLang: z.string().default('en').describe('The source language.'),
  nativeLanguage: z.string().default('ar').describe('The user\'s native language.'),
  context: z.string().optional().describe('The sentence or context in which the word appears.'),
});
export type TranslateWordInput = z.infer<typeof TranslateWordInputSchema>;

const TranslateWordOutputSchema = z.object({
  translation: z.string().describe('The translated word.'),
});
export type TranslateWordOutput = z.infer<typeof TranslateWordOutputSchema>;


function buildPrompt(input: TranslateWordInput): string {
    return `
      You are a hyper-efficient translator. Your task is to translate a single word based on its context.

      - Word to translate: "${input.word}"
      - Source Language: ${input.sourceLang}
      - Target Language: ${input.nativeLanguage}
      - Context sentence: "${input.context}"

      Your entire response MUST be a single, valid JSON object with one key: "translation".
      The value of "translation" should be the single best translation of the word in the given context.
      
      Example response:
      {
        "translation": "الكلمة المترجمة"
      }

      Return ONLY the JSON object. Do not provide explanations or alternative translations.
    `;
}


export async function translateWord(input: TranslateWordInput): Promise<TranslateWordOutput> {
    const { word } = TranslateWordInputSchema.parse(input);
    if (!word) {
        return { translation: '' };
    }

    const prompt = buildPrompt(input);

    try {
        const chatCompletion = await openai.chat.completions.create({
            "messages": [
                {
                    "role": "system",
                    "content": "You are a highly skilled polyglot translator. Your only task is to provide a single, context-aware translation in a valid JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "model": "gpt-4-turbo",
            "temperature": 0.1,
            "max_tokens": 1024,
            "top_p": 1,
             "response_format": {
                "type": "json_object"
            },
        });

        const responseContent = chatCompletion.choices[0]?.message?.content;
        
        if (!responseContent) {
            throw new Error("Received an empty response from the AI model.");
        }

        const parsedJson = JSON.parse(responseContent);
        const validatedOutput = TranslateWordOutputSchema.parse(parsedJson);

        return {
          translation: validatedOutput.translation.replace(/["'.]/g, '').trim(),
        };

    } catch (error: any) {
        console.error("OpenAI translation flow failed:", error);
         if (error instanceof z.ZodError) {
             throw new Error(`AI returned data in an unexpected format. Details: ${error.message}`);
        }
        throw new Error("Failed to get translation from AI service.");
    }
}
