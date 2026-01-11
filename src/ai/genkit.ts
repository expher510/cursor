'use server';
/**
 * @fileOverview This file initializes the Genkit AI instance with necessary plugins.
 *
 * It is crucial for this file to exist as it is imported by other flows and
 * components that rely on the centralized AI instance.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with the Google AI plugin.
// This `ai` instance is exported and used throughout the application to define
// and run generative AI flows, prompts, and tools.
export const ai = genkit({
  plugins: [googleAI()],
});
