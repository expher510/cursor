

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
