
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
  feedback?: string; 
};


export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
    {
      questionText: "This is a dummy question. What is the capital of France?",
      options: [
        "London",
        "Berlin",
        "Paris",
        "Madrid"
      ],
      correctAnswer: "Paris"
    },
    {
      questionText: "This is a sample question. Which of these is a color?",
      options: [
        "Blue",
        "Apple",
        "Chair",
        "Water"
      ],
      correctAnswer: "Blue"
    },
    {
      questionText: "Placeholder Question: What is 2 + 2?",
      options: [
        "3",
        "4",
        "5",
        "6"
      ],
      correctAnswer: "4"
    },
    {
      questionText: "Example: Which planet is known as the Red Planet?",
      options: [
        "Earth",
        "Mars",
        "Jupiter",
        "Venus"
      ],
      correctAnswer: "Mars"
    },
    {
      questionText: "This is for demo purposes. What is the opposite of 'hot'?",
      options: [
        "Warm",
        "Cold",
        "Spicy",
        "Large"
      ],
      correctAnswer: "Cold"
    }
];
