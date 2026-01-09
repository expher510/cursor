
export type QuizQuestion = {
  questionText: string;
  options: string[];
  correctAnswer: string;
};

export type QuizData = {
  questions: QuizQuestion[];
};

export const MOCK_QUIZ_DATA: QuizData = {
  questions: [
    {
      questionText: "What is the main topic of the video transcript?",
      options: [
        "The history of the internet",
        "The basics of the Arabic language",
        "Learning to cook Arabic food",
        "Traveling to the Middle East"
      ],
      correctAnswer: "The basics of the Arabic language"
    },
    {
      questionText: "How many people speak Arabic worldwide according to the transcript?",
      options: [
        "Less than 100 million",
        "Around 250 million",
        "Over 420 million",
        "Exactly 1 billion"
      ],
      correctAnswer: "Over 420 million"
    },
    {
      questionText: "In which direction is the Arabic script written?",
      options: [
        "Left to right",
        "Top to bottom",
        "Right to left",
        "Bottom to top"
      ],
      correctAnswer: "Right to left"
    },
    {
      questionText: "What does the root 'k-t-b' relate to?",
      options: [
        "Speaking",
        "Reading",
        "Writing",
        "Listening"
      ],
      correctAnswer: "Writing"
    },
    {
      questionText: "What does the word 'Kitab' mean?",
      options: [
        "Writer",
        "Book",
        "Library",
        "Paper"
      ],
      correctAnswer: "Book"
    }
  ]
};
