
'use server';
import { z } from 'zod';
import { Groq } from 'groq-sdk';

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

// Extended output to include raw response
export type GenerateQuizExtendedOutput = GenerateQuizOutput & {
  rawResponse: string;
};


// Helper function to build the prompt
function buildPrompt(input: GenerateQuizInput): string {
    return `
      You are an expert language teacher. Your task is to create a quick comprehension quiz based on a snippet from a video transcript.
      The user is a ${input.proficiencyLevel} learner of ${input.targetLanguage}.
      
      Generate an appropriate number of questions (between 7 and 10) to thoroughly test the student's comprehension of the provided transcript snippet.
      The questions should be appropriate for a ${input.proficiencyLevel} level.
      
      Here are the rules for the output:
      1. Your entire response MUST be a single, valid JSON object.
      2. The JSON object must contain a single key "questions".
      3. The value of "questions" must be an array of question objects.
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
export async function generateQuizFromTranscript(input: GenerateQuizInput): Promise<GenerateQuizExtendedOutput> {
    const prompt = buildPrompt(input);

    const chatCompletion = await groq.chat.completions.create({
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "model": "openai/gpt-oss-120b",
        "temperature": 0.7,
        "max_tokens": 1024,
        "top_p": 1,
        "stream": false,
        "response_format": {
            "type": "json_object"
        },
        "stop": null
    });
    
    const responseContent = chatCompletion.choices[0]?.message?.content || '';
    
    let parsedOutput: GenerateQuizOutput = { questions: [] };
    
    try {
        const parsedJson = JSON.parse(responseContent);
        // We still try to parse with Zod, but we won't crash if it fails.
        const validationResult = GenerateQuizOutputSchema.safeParse(parsedJson);
        if (validationResult.success) {
            parsedOutput = validationResult.data;
        } else {
             console.warn("AI response for quiz did not match schema:", validationResult.error);
        }
    } catch (e) {
        console.error("Failed to parse AI response for quiz as JSON:", e);
    }
    
    return {
      ...parsedOutput,
      rawResponse: responseContent,
    };
}
