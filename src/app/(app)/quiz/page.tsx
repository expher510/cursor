'use client';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generateQuiz, type QuizOutput } from '@/ai/flows/quiz-flow';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


// Quiz State Management
function useQuiz(questions: QuizOutput['questions']) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(questions.length).fill(''));
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = (currentQuestionIndex / questions.length) * 100;

    const selectAnswer = (answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = answer;
        setUserAnswers(newAnswers);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
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

    const score = useMemo(() => {
        return userAnswers.reduce((correctCount, answer, index) => {
            return answer === questions[index].correctAnswer ? correctCount + 1 : correctCount;
        }, 0);
    }, [userAnswers, questions]);

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
        totalQuestions: questions.length,
    };
}


function QuizView({ quiz, onRetry }: { quiz: QuizOutput, onRetry: () => void }) {
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
        totalQuestions
     } = useQuiz(quiz.questions);

    const router = useRouter();
    
    if (isFinished) {
        return (
            <Card className="w-full max-w-3xl">
                <CardHeader className="text-center">
                    <CardTitle>Quiz Results</CardTitle>
                    <CardDescription>You scored {score} out of {totalQuestions}!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {quiz.questions.map((q, index) => {
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
                        <Button onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4"/> Try Again with New Questions</Button>
                        <Button variant="outline" onClick={() => router.push('/')}>Go to Homepage</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-3xl">
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

function QuizGenerator() {
    const searchParams = useSearchParams();
    const videoId = searchParams.get('v');
    const { firestore, user } = useFirebase();

    const [quiz, setQuiz] = useState<QuizOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getQuiz = async () => {
        if (!user || !firestore || !videoId) {
            setError("Missing user, database connection, or video ID.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setQuiz(null);

        try {
            const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}/transcripts`, videoId);
            const transcriptSnap = await getDoc(transcriptDocRef);

            if (!transcriptSnap.exists()) {
                throw new Error("Transcript not found for this video. Please process it from the homepage first.");
            }

            const transcriptText = transcriptSnap.data().content.map((t: any) => t.text).join(' ');
            const generatedQuiz = await generateQuiz({ transcript: transcriptText });

            if (!generatedQuiz || !generatedQuiz.questions || generatedQuiz.questions.length === 0) {
                 throw new Error("The AI failed to generate a quiz. The content might be too short or unsuitable.");
            }

            setQuiz(generatedQuiz);
        } catch (e: any) {
            console.error("Error generating quiz:", e);
            setError(e.message || "An unexpected error occurred while creating your quiz.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, firestore, videoId]);

    if (isLoading) {
        return (
            <Card className="w-full max-w-md text-center">
                 <CardHeader>
                    <CardTitle>Generating Your Quiz</CardTitle>
                    <CardDescription>Our AI is crafting questions based on the video...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-24">
                     <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
     if (error) {
        return (
            <Card className="w-full max-w-xl border-destructive bg-destructive/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle/> Quiz Generation Failed</CardTitle>
                    <CardDescription className="text-destructive/80">{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>We couldn't create the quiz. This can happen if the video transcript is very short or in a format the AI can't process.</p>
                     <Button onClick={getQuiz} variant="secondary" className="mt-4">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (quiz) {
        return <QuizView quiz={quiz} onRetry={getQuiz} />;
    }

    return null; // Should not be reached
}


export default function QuizPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
            <QuizGenerator />
        </Suspense>
      </main>
    </>
  );
}
