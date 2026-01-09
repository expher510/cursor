
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

// This mock data is used as a fallback and for placeholder content.
// Do not remove it, as it can cause silent failures in quiz generation.
export const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        questionText: "What is the primary topic of the video?",
        options: ["Cooking", "Technology", "History", "Sports"],
        correctAnswer: "Technology",
    },
    {
        questionText: "Which company is mentioned in relation to smart shirts?",
        options: ["Apple", "Google", "Samsung", "Amazon"],
        correctAnswer: "Samsung",
    },
    {
        questionText: "What does LiDAR technology help archaeologists see through?",
        options: ["Water", "Walls", "Tree canopies", "Solid rock"],
        correctAnswer: "Tree canopies",
    },
    {
        questionText: "What is the name of Amazon's wheeled robot assistant?",
        options: ["Alexa", "Echo", "Astro", "Spot"],
        correctAnswer: "Astro",
    },
    {
        questionText: "What problem are researchers trying to solve with drones in Kruger National Park?",
        options: ["Wildfires", "Drought", "Poaching", "Tourism"],
        correctAnswer: "Poaching",
    },
];
