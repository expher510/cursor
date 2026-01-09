
export type QuizQuestion = {
  questionText: string;
  options: string[];
  correctAnswer: string;
};

export type QuizData = {
  id: string;
  videoId: string;
  userId: string;
  questions: QuizQuestion[];
};

export const MOCK_QUIZ_DATA: Omit<QuizData, 'id' | 'videoId' | 'userId'> = {
  questions: [
    {
      questionText: "(Dummy Question) What is the capital of France?",
      options: [
        "London",
        "Berlin",
        "Paris",
        "Madrid"
      ],
      correctAnswer: "Paris"
    },
    {
      questionText: "(Dummy Question) Which of these is a color?",
      options: [
        "Blue",
        "Apple",
        "Chair",
        "Water"
      ],
      correctAnswer: "Blue"
    },
    {
      questionText: "(Dummy Question) What is 2 + 2?",
      options: [
        "3",
        "4",
        "5",
        "6"
      ],
      correctAnswer: "4"
    },
    {
      questionText: "(Dummy Question) Which planet is known as the Red Planet?",
      options: [
        "Earth",
        "Mars",
        "Jupiter",
        "Venus"
      ],
      correctAnswer: "Mars"
    },
    {
      questionText: "(Dummy Question) What is the opposite of 'hot'?",
      options: [
        "Warm",
        "Cold",
        "Spicy",
        "Large"
      ],
      correctAnswer: "Cold"
    }
  ]
};
