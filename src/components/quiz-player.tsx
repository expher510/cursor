
'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { type QuizData, type QuizQuestion, type UserAnswer } from '@/lib/quiz-data';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useWatchPage } from '@/context/watch-page-context';
import { useToast } from '@/hooks/use-toast';

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
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
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
        setUserAnswers(Array(questions.length).fill(null));
        setIsFinished(false);
    }, [questions]);

    const score = useMemo(() => {
        return shuffledQuestions.reduce((correctCount, question, index) => {
            return userAnswers[index] === question.correctAnswer ? correctCount + 1 : correctCount;
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


function QuizView({ quizId, onRetry }: { quizId: string, onRetry: () => void }) {
    const { videoData, quizData } = useWatchPage();
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    const questions = useMemo(() => quizData?.questions || [], [quizData]);

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
     } = useQuiz(questions);

     // Effect to save results automatically when quiz is finished
    useEffect(() => {
        if (isFinished && firestore && user && videoData?.videoId) {
            const saveResults = async () => {
                const quizDocRef = doc(firestore, `users/${user.uid}/videos/${videoData.videoId}/quizzes`, quizId);
                
                const detailedUserAnswers: UserAnswer[] = shuffledQuestions.map((question, index) => ({
                    questionText: question.questionText,
                    userAnswer: userAnswers[index],
                    correctAnswer: question.correctAnswer,
                }));

                try {
                    await updateDoc(quizDocRef, {
                        score: score,
                        userAnswers: detailedUserAnswers,
                    });
                     toast({ title: "Results Saved", description: "Your quiz results have been saved." });
                } catch (error) {
                    console.error("Failed to save quiz results:", error);
                    toast({ variant: "destructive", title: "Save Failed", description: "Could not save your quiz results." });
                }
            };
            saveResults();
        }
    }, [isFinished, firestore, user, videoData?.videoId, quizId, score, userAnswers, shuffledQuestions, toast]);
    
    if (isFinished) {
        return (
            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Quiz Review</CardTitle>
                    <CardDescription>Check your answers below.</CardDescription>
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
                </CardContent>
                <CardFooter className="flex-col gap-4 pt-6 border-t text-center">
                    <div className="space-y-2">
                        <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
                            <span className="text-4xl font-bold text-primary">{score}</span>
                        </div>
                        <h3 className="text-xl font-bold">You scored {score} out of {totalQuestions}!</h3>
                        <p className="text-sm text-muted-foreground pt-2">
                            A detailed performance evaluation will be sent to your email.
                        </p>
                    </div>
                    <div className="flex justify-center gap-4 pt-4">
                        <Button onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4"/> Try Again</Button>
                        <Button variant="outline" onClick={() => router.push('/')}>Go to Homepage</Button>
                    </div>
                </CardFooter>
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
                    value={userAnswers[currentQuestionIndex] || ''}
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
                    <Button variant="outline" onClick={prevQuestion} disabled={currentQuestionIndex === 0}><ChevronLeft className="mr-2 h-4 w-4"/>Back</Button>
                    {currentQuestionIndex < totalQuestions - 1 ? (
                        <Button onClick={nextQuestion} disabled={userAnswers[currentQuestionIndex] === null}>Next <ChevronRight className="ml-2 h-4 w-4"/></Button>
                    ) : (
                        <Button onClick={finishQuiz} disabled={userAnswers[currentQuestionIndex] === null}>Finish</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function QuizPlayer({ quizId }: { quizId: string }) {
    // We need a key to force re-mounting of the component on retry
    const [quizKey, setQuizKey] = useState(Date.now());

    const handleRetry = () => {
        setQuizKey(Date.now());
    }

    return <QuizView key={quizKey} quizId={quizId} onRetry={handleRetry} />;
}
