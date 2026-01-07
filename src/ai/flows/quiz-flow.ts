
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript.
 *
 * - generateQuiz - A function that takes a video transcript and returns a set of quiz questions.
 */

import { ai } from '@/ai/genkit';
import { QuizInputSchema, QuizOutputSchema, type QuizInput, type QuizOutput } from '@/ai/schemas/quiz-schema';


/**
 * This is the prompt you would use with a compatible LLM like Groq.
 * Since this environment uses Genkit with Google AI, we cannot call it directly.
 * Instead, this flow returns mock data.
 *
 * To use this with Groq, you would make a request to their API with a prompt
 * structured like the one below, and ask for a JSON response that matches
*  the QuizOutputSchema.
 */
const groqPrompt = `
    You are an AI assistant designed to help language learners test their comprehension.
    Your task is to create a multiple-choice quiz based on the following video transcript.

    Generate a specific number of questions (let's say 5) that cover the main points of the text.
    Each question must have exactly 4 possible answers, and only one of them should be correct.
    Ensure the questions are relevant to the content and test understanding, not just word recognition.

    Respond with ONLY a valid JSON object that strictly follows this Zod schema:
    
    \`\`\`json
    {
        "questions": [
            {
                "questionText": "string",
                "options": ["string", "string", "string", "string"],
                "correctAnswer": "string"
            }
        ]
    }
    \`\`\`

    Here is the transcript:
    ---
    {{transcript}}
    ---
`;

// This is a wrapper function that we will call from our components.
export async function generateQuiz(input: QuizInput): Promise<QuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: QuizInputSchema,
    outputSchema: QuizOutputSchema,
  },
  async (input) => {
    
    // In a real scenario, you would make an API call to Groq here using the prompt above.
    // For now, we will return mock data that matches the expected output schema.
    
    console.log("--- Generating Mock Quiz Data ---");
    console.log("Transcript length:", input.transcript.length);
    console.log("Prompt to use with Groq would be:", groqPrompt.replace('{{transcript}}', input.transcript));


    return {
      questions: [
        {
          questionText: "What is the primary topic of the video?",
          options: ["Cooking", "History", "Language", "Sports"],
          correctAnswer: "Language"
        },
        {
          questionText: "How many people speak the language discussed?",
          options: ["10 million", "100 million", "Over 420 million", "Under 5 million"],
          correctAnswer: "Over 420 million"
        },
        {
          questionText: "In which direction is the script written?",
          options: ["Left to right", "Top to bottom", "Right to left", "Bottom to top"],
          correctAnswer: "Right to left"
        },
        {
          questionText: "What does the root 'k-t-b' relate to?",
          options: ["Food", "Travel", "Writing", "Music"],
          correctAnswer: "Writing"
        },
        {
          questionText: "What does 'Kitab' mean?",
          options: ["Writer", "Book", "School", "Paper"],
          correctAnswer: "Book"
        }
      ]
    };
  }
);
