import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import 'dotenv/config';


export const ai = genkit({
  plugins: [googleAI({project: process.env.GOOGLE_PROJECT_ID})],
});
