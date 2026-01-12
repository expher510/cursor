
'use server';
/**
 * @fileOverview A flow for translating a full sentence using the OpenAI API.
 *
 * - translateSentence - A function that takes a sentence and returns its translation.
 * - TranslateSentenceInput - The input type for the translateSentence function.
 * - TranslateSentenceOutput - The return type for the translateSentence function.
 */

import { z } from 'zod';
import OpenAI from 'openai';

const openai = new OpenAI();

const TranslateSentenceInputSchema = z.object({
  sentence: z.string().describe('The sentence to translate.'),
  sourceLang: z.string().default('en').describe('The source language of the sentence.'),
  nativeLanguage: z.string().default('ar').describe('The user\'s native language to translate to.'),
});
export type TranslateSentenceInput = z.infer<typeof TranslateSentenceInputSchema>;

const TranslateSentenceOutputSchema = z.object({
  translation: z.string().describe('The translated sentence.'),
});
export type TranslateSentenceOutput = z.infer<typeof TranslateSentenceOutputSchema>;


function buildPrompt(input: TranslateSentenceInput): string {
    return `
      You are an expert translator. Your task is to translate the following sentence.

      - Sentence to translate: "${input.sentence}"
      - Source Language: ${input.sourceLang}
      - Target Language: ${input.nativeLanguage}

      Your entire response MUST be a single, valid JSON object with one key: "translation".
      The value of "translation" should be the most accurate translation of the sentence.
      
      Example response for translating to Arabic:
      {
        "translation": "الجملة المترجمة هنا."
      }

      Return ONLY the JSON object. Do not provide explanations or alternative translations.
    `;
}


export async function translateSentence(input: TranslateSentenceInput): Promise<TranslateSentenceOutput> {
    const { sentence } = TranslateSentenceInputSchema.parse(input);
    if (!sentence) {
        return { translation: '' };
    }

    const prompt = buildPrompt(input);

    try {
        const chatCompletion = await openai.chat.completions.create({
            "messages": [
                {
                    "role": "system",
                    "content": "You are a highly skilled polyglot translator. Your only task is to provide a single, accurate translation in a valid JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "model": "gpt-4-turbo",
            "temperature": 0.2,
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
        const validatedOutput = TranslateSentenceOutputSchema.parse(parsedJson);

        return {
          translation: validatedOutput.translation.trim(),
        };

    } catch (error: any) {
        console.error("OpenAI sentence translation flow failed:", error);
         if (error instanceof z.ZodError) {
             throw new Error(`AI returned data in an unexpected format. Details: ${error.message}`);
        }
        throw new Error("Failed to get sentence translation from AI service.");
    }
}
