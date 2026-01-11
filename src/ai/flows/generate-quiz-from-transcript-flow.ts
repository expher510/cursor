
'use server';
import { z } from 'zod';
import { Groq } from 'groq-sdk';
import 'dotenv/config';

const groq = new Groq();

// Define the schema for a single quiz question
const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('An array of 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options array.'),
});

// Define the schema for the input of our flow
const GenerateQuizInputSchema = z.object({
  transcript: z.string().describe('The full transcript of the video.'),
  targetLanguage: z.string().describe('The language the user is learning (e.g., "Spanish", "Arabic").'),
  proficiencyLevel: z.string().describe('The user\'s proficiency level (e.g., "beginner", "intermediate", "advanced").'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Define the schema for the output of our flow
const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated list of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

// Helper function to build the prompt
function buildPrompt(input: GenerateQuizInput): string {
    return `
      You are an expert language teacher. Your task is to create a quick comprehension quiz based on a snippet from a video transcript.
      The user is a ${input.proficiencyLevel} learner of ${input.targetLanguage}.
      
      Create a quiz with exactly 3 questions that are appropriate for a ${input.proficiencyLevel} level.
      The questions should test understanding of the provided transcript snippet.
      
      Here are the rules for the output:
      1. Your entire response MUST be a single, valid JSON object.
      2. The JSON object must contain a single key "questions".
      3. The value of "questions" must be an array of 3 question objects.
      4. Each question object must have three properties: "questionText", "options" (an array of 4 choices), and "correctAnswer".
      5. The language of "questionText", "options", and "correctAnswer" MUST be in ${input.targetLanguage}.

      Transcript Snippet:
      ---
      ${input.transcript.substring(0, 4000)}
      ---

      Return ONLY the JSON object. Do not include any other text, explanations, or markdown formatting.
    `;
}

// This is the public wrapper function that components will call.
export async function generateQuizFromTranscript(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
    try {
        const prompt = buildPrompt(input);

        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "model": "llama-3.1-70b-versatile",
            "temperature": 0.7,
            "max_tokens": 1024,
            "top_p": 1,
            "stream": false, // Use direct response for reliability
            "response_format": {
                "type": "json_object" // Ensure the output is a valid JSON object
            },
            "stop": null
        });
        
        const responseContent = chatCompletion.choices[0]?.message?.content;

        console.log("--- GROQ API RESPONSE ---");
        console.log(responseContent);
        console.log("-------------------------");
        
        if (!responseContent) {
            throw new Error("Received an empty response from the AI model.");
        }
        
        // No need to clean the response, as we requested a JSON object directly
        const parsedJson = JSON.parse(responseContent);
        
        const validatedOutput = GenerateQuizOutputSchema.parse(parsedJson);
        return validatedOutput;

    } catch (error) {
        console.error("Error generating quiz with Groq:", error);
        if (error instanceof z.ZodError) {
             throw new Error(`AI returned data in an unexpected format. Details: ${error.message}`);
        }
        // Throw a generic error to be caught by the UI
        throw new Error("Failed to generate quiz. Please try again later.");
    }
}
