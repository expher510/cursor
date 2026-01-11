
'use server';
import { z } from 'zod';
import { Groq } from 'groq-sdk';
import 'dotenv/config';

const groq = new Groq();

// Define the schema for the input of our flow
const GenerateWritingFeedbackInputSchema = z.object({
  writingText: z.string().describe('The text written by the user.'),
  usedWords: z.array(z.string()).describe('The list of words the user was prompted to use.'),
  targetLanguage: z.string().describe('The language the user is learning (e.g., "Spanish", "Arabic").'),
  nativeLanguage: z.string().describe('The user\'s native language (e.g., "English").'),
  proficiencyLevel: z.string().describe('The user\'s proficiency level (e.g., "beginner", "intermediate", "advanced").'),
});
export type GenerateWritingFeedbackInput = z.infer<typeof GenerateWritingFeedbackInputSchema>;

// Define the schema for the output of our flow
const GenerateWritingFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Overall constructive feedback on the user\'s writing.'),
  score: z.number().min(0).max(100).describe('A score from 0 to 100 representing the quality of the writing.'),
  suggestions: z.array(z.string()).describe('Specific suggestions for improvement.'),
});
export type GenerateWritingFeedbackOutput = z.infer<typeof GenerateWritingFeedbackOutputSchema>;

// Helper function to build the prompt for Groq
function buildPrompt(input: GenerateWritingFeedbackInput): string {
    const wordList = input.usedWords.join(', ');
    return `
      You are an expert language teacher specializing in providing feedback for ${input.targetLanguage} learners.
      The user's native language is ${input.nativeLanguage} and their proficiency level is ${input.proficiencyLevel}.

      The user was asked to write a paragraph using the following words: ${wordList}.
      
      Here is the user's writing:
      ---
      ${input.writingText}
      ---

      Your task is to provide feedback in a structured JSON format. Your entire response MUST be a single, valid JSON object.
      The JSON object must contain three keys: "feedback", "score", and "suggestions".

      1.  **feedback**: (string) Provide overall constructive feedback. Comment on grammar, vocabulary usage, and sentence structure. Be encouraging but clear. Keep it concise (2-4 sentences).
      2.  **score**: (number) Give a score from 0 to 100. Base the score on:
          - Correct usage of the provided words.
          - Grammatical accuracy.
          - Naturalness and fluency of the text for a ${input.proficiencyLevel} learner.
      3.  **suggestions**: (array of strings) Provide a list of 2-3 specific, actionable suggestions for improvement. For example, "Instead of '...', you could say '...'" or "The word '...' is used correctly, but a more natural choice would be '...'".

      Return ONLY the JSON object. Do not include any other text, explanations, or markdown formatting. The language of the feedback itself should be in English.
    `;
}

// This is the public wrapper function that components will call.
export async function generateWritingFeedback(input: GenerateWritingFeedbackInput): Promise<GenerateWritingFeedbackOutput> {
    const prompt = buildPrompt(input);

    try {
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "model": "llama-3.1-8b-instant", 
            "temperature": 0.6,
            "max_tokens": 1024,
            "top_p": 1,
            "stream": false,
            "response_format": {
                "type": "json_object"
            },
            "stop": null
        });
        
        const responseContent = chatCompletion.choices[0]?.message?.content;
        
        if (!responseContent) {
            throw new Error("Received an empty response from the AI model.");
        }
        
        const parsedJson = JSON.parse(responseContent);
        
        const validatedOutput = GenerateWritingFeedbackOutputSchema.parse(parsedJson);
        
        return validatedOutput;

    } catch (error) {
        console.error("Error generating writing feedback with Groq:", error);
        if (error instanceof z.ZodError) {
             throw new Error(`AI returned data in an unexpected format. Details: ${error.message}`);
        }
        // Throw a generic error to be caught by the UI
        throw new Error("Failed to generate feedback. Please try again later.");
    }
}
