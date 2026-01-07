
'use server';
/**
 * @fileOverview A flow for generating a multiple-choice quiz from a video transcript.
 *
 * - generateQuiz - A function that takes a video transcript and returns a set of quiz questions.
 */

import { ai } from '@/ai/genkit';
import { QuizInputSchema, QuizOutputSchema, type QuizInput, type QuizOutput } from '@/ai/schemas/quiz-schema';
import 'dotenv/config';


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
    
    // --- Step 1: Define the prompt for Groq ---
    const groqPrompt = `
      You are an AI assistant designed to help language learners test their comprehension.
      Your task is to create a multiple-choice quiz based on the following video transcript.

      Generate 5 questions that cover the main points of the text.
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
      ${input.transcript}
      ---
    `;

    // --- Step 2: Make the API call to Groq (Currently commented out) ---
    // To enable this, uncomment the following block and add your GROQ_API_KEY to the .env file.
    /*
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not defined in your .env file.');
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${GROQ_API_KEY}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: groqPrompt }],
          model: 'llama3-8b-8192', // Or another model you prefer
          temperature: 0.7,
          n: 1,
          stream: false,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(\`Groq API request failed: \${response.status} \${errorBody}\`);
      }

      const result = await response.json();
      const content = JSON.parse(result.choices[0].message.content);
      
      // Validate the response with Zod before returning
      const validatedOutput = QuizOutputSchema.parse(content);
      return validatedOutput;

    } catch (error) {
      console.error("Error calling Groq API:", error);
      throw new Error("Failed to generate quiz from Groq API.");
    }
    */

    // --- Step 3: Return mock data (Remove this when you enable the API call) ---
    console.log("--- Generating Mock Quiz Data (Groq API call is disabled) ---");
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
