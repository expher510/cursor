'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { type QuizData, type QuizQuestion } from '@/lib/quiz-data';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};


function useQuiz(questions: QuizQuestion[]) {
    const [shuffledQuestions, setShuffledQuestions] = useState(() => shuffleArray(questions));
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(questions.length).fill(''));
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;

    const selectAnswer = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < shuffledQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const finishQuiz = () => {
        setIsFinished(true);
    };
    
    const resetQuiz = useCallback(() => {
        setShuffledQuestions(shuffleArray(questions));
        setCurrentQuestionIndex(0);
        setUserAnswers(Array(questions.length).fill(''));
        setIsFinished(false);
    }, [questions]);

    const score = useMemo(() => {
        return userAnswers.reduce((correctCount, answer, index) => {
            return answer === shuffledQuestions[index]?.correctAnswer ? correctCount + 1 : correctCount;
        }, 0);
    }, [userAnswers, shuffledQuestions]);

    return {
        currentQuestionIndex,
        currentQuestion,
        userAnswers,
        isFinished,
        progress,
        score,
        selectAnswer,
        nextQuestion,
        prevQuestion,
        finishQuiz,
        resetQuiz,
        shuffledQuestions,
        totalQuestions: shuffledQuestions.length,
    };
}


function QuizView({ quiz, onRetry }: { quiz: QuizData, onRetry: () => void }) {
    const { 
        currentQuestionIndex,
        currentQuestion,
        userAnswers,
        isFinished,
        progress,
        score,
        selectAnswer,
        nextQuestion,
        prevQuestion,
        finishQuiz,
        shuffledQuestions,
        totalQuestions
     } = useQuiz(quiz.questions);

    const router = useRouter();
    
    if (isFinished) {
        return (
            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle>Quiz Results</CardTitle>
                    <CardDescription>You scored {score} out of {totalQuestions}!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {shuffledQuestions.map((q, index) => {
                            const userAnswer = userAnswers[index];
                            const isCorrect = userAnswer === q.correctAnswer;
                            return (
                                <div key={index} className="p-4 rounded-lg border">
                                    <div className="flex items-start gap-3">
                                        {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 mt-1" /> : <XCircle className="h-5 w-5 text-destructive mt-1" />}
                                        <p className="flex-1 font-semibold">{index + 1}. {q.questionText}</p>
                                    </div>
                                    <div className="pl-8 mt-2 text-sm">
                                        {!isCorrect && <p className="text-destructive">Your answer: {userAnswer || "Not answered"}</p>}
                                        <p className="text-green-600">Correct answer: {q.correctAnswer}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-center gap-4">
                        <Button onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4"/> Try Again</Button>
                        <Button variant="outline" onClick={() => router.push('/')}>Go to Homepage</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (!currentQuestion) {
        // This can happen briefly while shuffling, show a loader or nothing.
        return null;
    }


    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <Progress value={progress} className="w-full mb-4" />
                <CardTitle>Question {currentQuestionIndex + 1}/{totalQuestions}</CardTitle>
                <CardDescription className="text-lg pt-2">{currentQuestion.questionText}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <RadioGroup
                    value={userAnswers[currentQuestionIndex]}
                    onValueChange={selectAnswer}
                    className="space-y-3"
                >
                    {currentQuestion.options.map((option, index) => (
                        <Label key={index} htmlFor={`option-${index}`} className={cn(
                           "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted",
                           userAnswers[currentQuestionIndex] === option && "bg-primary/10 border-primary"
                        )}>
                            <RadioGroupItem value={option} id={`option-${index}`} />
                            <span className="text-base">{option}</span>
                        </Label>
                    ))}
                </RadioGroup>

                <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>Back</Button>
                    {currentQuestionIndex < totalQuestions - 1 ? (
                        <Button onClick={nextQuestion}>Next</Button>
                    ) : (
                        <Button onClick={finishQuiz}>Finish</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function QuizPlayer({ quiz }: { quiz: QuizData }) {
    // We need a key to force re-mounting of the component on retry
    const [quizKey, setQuizKey] = useState(0);

    const handleRetry = () => {
        setQuizKey(prev => prev + 1);
    }

    return <QuizView key={quizKey} quiz={quiz} onRetry={handleRetry} />;
}
