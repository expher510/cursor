
'use server';
import { z } from 'zod';
import { Groq } from 'groq-sdk';

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
      You are an expert language teacher providing feedback for a ${input.targetLanguage} learner whose native language is ${input.nativeLanguage}. The student's proficiency level is ${input.proficiencyLevel}.

      The user was asked to write a paragraph in ${input.targetLanguage} using the following words: ${wordList}.
      
      Here is the user's writing:
      ---
      ${input.writingText}
      ---

      Your entire response MUST be in the user's native language: ${input.nativeLanguage}.

      Your task is to provide feedback in a structured JSON format. Your entire response MUST be a single, valid JSON object.
      The JSON object must contain three keys: "feedback", "score", and "suggestions".

      SPECIAL INSTRUCTION 1: Analyze the user's text. If it is just a random, nonsensical jumble of words with no clear attempt to form a sentence or coherent thought, you MUST provide a roasting/sarcastic but funny response. For example: "Did a cat walk on your keyboard? I asked for a paragraph, not a grocery list.", and give a score of 0.

      SPECIAL INSTRUCTION 2: Analyze the language of the user's text. If you detect that it is written in a language OTHER THAN the target language (${input.targetLanguage}), you must provide a funny, in-character response. For example: "Whoa there! I'm a ${input.targetLanguage} teacher, what is this language you're speaking? It looks interesting, but it's not what I teach!", give a score of 0, and in the "suggestions" array, suggest that the user might want to change their target language from the main page if they intended to practice a different language.

      If the text is a genuine attempt in the correct language, follow these rules:
      1.  **feedback**: (string) Provide overall constructive feedback. Comment on grammar, vocabulary usage, and sentence structure. Be encouraging but clear. Identify specific errors and explain how to fix them.
      2.  **score**: (number) Give a score from 0 to 100 based on: correct usage of the words, grammatical accuracy, and naturalness.
      3.  **suggestions**: (array of strings) Provide a list of specific, actionable suggestions for improvement. For example: "Instead of '...', you should say '...' because...".

      Return ONLY the JSON object. Do not include any other text or markdown formatting.
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
