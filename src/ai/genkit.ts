import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { groq } from '@genkit-ai/groq';
import 'dotenv/config';


export const ai = genkit({
  plugins: [googleAI(), groq()],
  model: 'googleai/gemini-2.5-flash',
});
