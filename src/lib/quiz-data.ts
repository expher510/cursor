

export type QuizQuestion = {
  questionText: string;
  options: string[];
  correctAnswer: string;
};

export type UserAnswer = {
  questionText: string;
  userAnswer: string | null;
  correctAnswer: string;
};

export type QuizData = {
  id?: string;
  videoId?: string;
  userId?: string;
  questions: QuizQuestion[];
  score?: number;
  userAnswers?: UserAnswer[];
};


// This is placeholder data used when a video is first processed.
// A real quiz is generated on-demand when the user clicks "Take a Quiz".
export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        questionText: "What is the capital of France?",
        options: ["Berlin", "Madrid", "Paris", "Rome"],
        correctAnswer: "Paris"
    },
    {
        questionText: "Which planet is known as the Red Planet?",
        options: ["Earth", "Mars", "Jupiter", "Venus"],
        correctAnswer: "Mars"
    },
    {
        questionText: "Who wrote 'Hamlet'?",
        options: ["Charles Dickens", "William Shakespeare", "Leo Tolstoy", "Mark Twain"],
        correctAnswer: "William Shakespeare"
    }
];
