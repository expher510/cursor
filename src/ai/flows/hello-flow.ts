'use server';
/**
 * @fileOverview An example flow that demonstrates how to use Genkit.
 *
 * - helloFlow - A function that takes a name and returns a greeting.
 * - HelloFlowInput - The input type for the helloFlow function.
 * - HelloFlowOutput - The return type for the helloFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for the flow
const HelloFlowInputSchema = z.object({
  name: z.string().describe('The name to include in the greeting.'),
});
export type HelloFlowInput = z.infer<typeof HelloFlowInputSchema>;

// Define the output schema for the flow
const HelloFlowOutputSchema = z.object({
  greeting: z.string().describe('The generated greeting.'),
});
export type HelloFlowOutput = z.infer<typeof HelloFlowOutputSchema>;


// This is the public wrapper function that components will call.
export async function helloFlow(input: HelloFlowInput): Promise<HelloFlowOutput> {
  // Execute the flow and return the result.
  const greeting = await helloFlowInternal(input);
  return { greeting };
}

// Define the internal Genkit flow.
const helloFlowInternal = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: HelloFlowInputSchema,
    // The internal flow will return a string. The wrapper adds the object structure.
    outputSchema: z.string(),
  },
  async ({ name }) => {
    // Call the model to generate the content.
    const { text } = await ai.generate(`Please say a friendly hello to ${name}`);
    return text();
  }
);
