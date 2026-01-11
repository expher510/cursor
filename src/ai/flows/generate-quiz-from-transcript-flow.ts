
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript
 * using the Groq API directly.
 *
 * - generateQuizFromTranscript - A function that creates quiz questions.
 * - GenerateQuizInput - The input type for the function.
 * - GenerateQuizOutput - The return type for the function.
 */

import { z } from 'zod';
import Groq from 'groq-sdk';
import 'dotenv/config';

// Initialize the Groq SDK client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// Schema for a single quiz question
const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('An array of 4 possible answers.'),
  correctAnswer: z.string().describe('The correct answer from the options array.'),
});

// Input schema for the flow
const GenerateQuizInputSchema = z.object({
  transcript: z.string().describe('The full transcript of the video.'),
  targetLanguage: z.string().describe('The language the user is learning (e.g., "Spanish", "Arabic").'),
  proficiencyLevel: z.string().describe('The user\'s proficiency level (e.g., "beginner", "intermediate", "advanced").'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// Output schema for the flow
const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated list of quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


function buildPrompt(transcript: string, targetLanguage: string, proficiency: string): string {
    return `
      You are an expert language teacher. Your task is to create a quick comprehension quiz based on a snippet from a video transcript.
      The user is a ${proficiency} learner of ${targetLanguage}.
      
      Create a quiz with exactly 3 questions that are appropriate for a ${proficiency} level.
      The questions should test understanding of the provided transcript snippet.
      
      Here are the rules for the output:
      1. Provide the output as a SINGLE, VALID JSON object.
      2. The JSON object must contain a single key "questions".
      3. The value of "questions" must be an array of 3 question objects.
      4. Each question object must have three properties: "questionText", "options" (an array of 4 choices), and "correctAnswer".
      5. The language of "questionText", "options", and "correctAnswer" MUST be in ${targetLanguage}.

      Transcript Snippet:
      ---
      ${transcript.substring(0, 2000)}
      ---

      Return ONLY the JSON object. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
    `;
}

// This is the public wrapper function that components will call.
export async function generateQuizFromTranscript(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set in environment variables.');
    }
    
    const prompt = buildPrompt(input.transcript, input.targetLanguage, input.proficiencyLevel);

    console.log("Groq Prompt being sent...");

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                }
            ],
            model: "llama-3.1-70b-versatile",
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
            stream: true, // Enable streaming
        });
        
        let fullContent = '';
        for await (const chunk of chatCompletion) {
            fullContent += chunk.choices[0]?.delta?.content || '';
        }

        if (!fullContent) {
            throw new Error("Groq API returned an empty streamed response.");
        }
        
        // Find the start and end of the JSON object
        const jsonStart = fullContent.indexOf('{');
        const jsonEnd = fullContent.lastIndexOf('}');

        if (jsonStart === -1 || jsonEnd === -1) {
            console.error("Invalid response from AI, no JSON found:", fullContent);
            throw new Error("AI response did not contain a valid JSON object.");
        }
        
        const jsonString = fullContent.substring(jsonStart, jsonEnd + 1);

        // The response should be a JSON object string, so we parse it.
        const parsedJson = JSON.parse(jsonString);

        // Validate the parsed JSON against our Zod schema
        const validatedOutput = GenerateQuizOutputSchema.parse(parsedJson);

        return validatedOutput;

    } catch (error) {
        console.error("Error generating quiz with Groq:", error);
        if (error instanceof z.ZodError) {
             throw new Error(`AI returned data in an unexpected format. Details: ${error.message}`);
        }
        throw new Error("Failed to generate quiz. Please try again later.");
    }
}
