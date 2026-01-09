
export type QuizQuestion = {
  questionText: string;
  options: string[];
  correctAnswer: string;
};

export type QuizData = {
  id?: string; // Made optional as it's the doc id
  videoId?: string; // Made optional as it's part of the path
  userId?: string; // Made optional as it's part of the path
  questions: QuizQuestion[];
  feedback?: string; // Added optional feedback field
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
