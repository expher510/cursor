
'use client';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { doc, getDoc, collection, DocumentReference } from 'firebase/firestore';
import { generateQuiz } from '@/ai/flows/quiz-flow';
import { type QuizOutput } from '@/ai/schemas/quiz-schema';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type AnswerState = {
    selectedAnswer: string | null;
    isCorrect: boolean | null;
};

type QuizDoc = QuizOutput & { id: string; score?: number; userAnswers?: string[] };

function QuizView({ quizDoc, videoTitle, onQuizFinish }: { quizDoc: QuizDoc, videoTitle: string, onQuizFinish: (score: number, answers: AnswerState[]) => void }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerState[]>(Array(quizDoc.questions.length).fill({ selectedAnswer: null, isCorrect: null }));
    const [isFinished, setIsFinished] = useState(false);

    const questions = quizDoc.questions;
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestionIndex];

    const handleAnswerSelect = (answer: string) => {
        if (currentAnswer.selectedAnswer) return; // Already answered

        const isCorrect = answer === currentQuestion.correctAnswer;
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = { selectedAnswer: answer, isCorrect };
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setIsFinished(true);
        }
    };
    
    // Call onQuizFinish when the last question is answered
    useEffect(() => {
        const lastAnswer = answers[questions.length - 1];
        if (lastAnswer.selectedAnswer !== null) {
             const finalScore = answers.filter(a => a.isCorrect).length;
             onQuizFinish(finalScore, answers);
             if (currentQuestionIndex === questions.length - 1) {
                setIsFinished(true);
            }
        }
    }, [answers, questions.length, onQuizFinish, currentQuestionIndex]);


    const score = useMemo(() => answers.filter(a => a.isCorrect).length, [answers]);

    const restartQuiz = () => {
        setCurrentQuestionIndex(0);
        setAnswers(Array(quizDoc.questions.length).fill({ selectedAnswer: null, isCorrect: null }));
        setIsFinished(false);
    }
    
    // Load previous answers if they exist
    useEffect(() => {
        if (quizDoc.userAnswers && quizDoc.userAnswers.length === questions.length) {
            const loadedAnswers = quizDoc.userAnswers.map((userAnswer, index) => {
                const question = questions[index];
                if (!userAnswer) return { selectedAnswer: null, isCorrect: null };
                
                const isCorrect = userAnswer === question.correctAnswer;
                return { selectedAnswer: userAnswer, isCorrect: isCorrect };
            });
            setAnswers(loadedAnswers);
            
            // If all questions were answered, mark as finished
            if(loadedAnswers.every(a => a.selectedAnswer !== null)) {
                setIsFinished(true);
            }
        }
    }, [quizDoc, questions]);


    if (isFinished) {
        return (
            <Card className="w-full max-w-2xl text-center">
                <CardHeader>
                    <CardTitle>Quiz Complete!</CardTitle>
                    <CardDescription>You've finished the quiz for "{videoTitle}".</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-4xl font-bold">
                        Your Score: {score} / {questions.length}
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={restartQuiz}><RefreshCw className="mr-2" /> Try Again</Button>
                        <Button asChild variant="outline">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Comprehension Quiz</CardTitle>
                <CardDescription>Question {currentQuestionIndex + 1} of {questions.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-lg font-semibold">{currentQuestion.questionText}</p>
                <RadioGroup
                    value={currentAnswer.selectedAnswer ?? ''}
                    onValueChange={handleAnswerSelect}
                    disabled={!!currentAnswer.selectedAnswer}
                >
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = currentAnswer.selectedAnswer === option;
                        const isCorrect = currentQuestion.correctAnswer === option;
                        return (
                            <Label
                                key={index}
                                className={cn(
                                    "flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors",
                                    currentAnswer.selectedAnswer && isCorrect && "border-green-500 bg-green-500/10",
                                    currentAnswer.selectedAnswer && isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                                    !currentAnswer.selectedAnswer && "hover:bg-muted"
                                )}
                            >
                                <RadioGroupItem value={option} />
                                <span>{option}</span>
                                {currentAnswer.selectedAnswer && isCorrect && <CheckCircle className="ml-auto text-green-500" />}
                                {currentAnswer.selectedAnswer && isSelected && !isCorrect && <XCircle className="ml-auto text-red-500" />}
                            </Label>
                        );
                    })}
                </RadioGroup>

                {currentAnswer.selectedAnswer && (
                    <div className="flex justify-end">
                        <Button onClick={handleNext}>
                            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


function QuizGenerator() {
    const searchParams = useSearchParams();
    const videoId = searchParams.get('v');
    const { firestore, user } = useFirebase();

    const [quizDoc, setQuizDoc] = useState<QuizDoc | null>(null);
    const [videoTitle, setVideoTitle] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quizDocRef, setQuizDocRef] = useState<DocumentReference | null>(null);

    useEffect(() => {
        if (!videoId || !user || !firestore) {
            setError("Missing video ID, user, or Firebase instance.");
            setIsLoading(false);
            return;
        }

        async function getOrCreateQuiz() {
            try {
                // 1. Check for existing quiz with predictable ID
                const predictableQuizDocRef = doc(firestore, `users/${user!.uid}/videos/${videoId}/quizzes`, videoId);
                setQuizDocRef(predictableQuizDocRef);
                const quizSnap = await getDoc(predictableQuizDocRef);


                if (quizSnap.exists()) {
                    console.log("Found existing quiz in Firestore.");
                    setQuizDoc({ id: quizSnap.id, ...quizSnap.data() } as QuizDoc);
                } else {
                    console.log("No existing quiz. Generating a new one.");
                    // 2. Fetch transcript
                    const transcriptRef = doc(firestore, `users/${user!.uid}/videos/${videoId}/transcripts`, videoId);
                    const transcriptSnap = await getDoc(transcriptRef);
                    if (!transcriptSnap.exists()) throw new Error("Transcript not found for this video. Please process the video first.");
                    
                    const transcriptContent = transcriptSnap.data().content.map((t: any) => t.text).join(' ');

                    // 3. Generate quiz
                    const newQuiz = await generateQuiz({ transcript: transcriptContent });

                     if (!newQuiz || !newQuiz.questions || newQuiz.questions.length === 0) {
                        throw new Error("The AI model failed to generate valid quiz questions.");
                    }

                    // 4. Save to Firestore with predictable ID
                    const newQuizData = { ...newQuiz, id: videoId, videoId, userId: user.uid };
                    setDocumentNonBlocking(predictableQuizDocRef, newQuizData, {});
                    setQuizDoc(newQuizData as QuizDoc);
                }

                // Fetch video title for display
                 const videoDocRef = doc(firestore, `users/${user!.uid}/videos/${videoId}`);
                 const videoDocSnap = await getDoc(videoDocRef);
                 if (videoDocSnap.exists()) {
                     setVideoTitle(videoDocSnap.data().title || 'Video');
                 }

            } catch (e: any) {
                console.error("Failed to get or create quiz:", e);
                setError(e.message || "An unknown error occurred while generating the quiz.");
            } finally {
                setIsLoading(false);
            }
        }

        getOrCreateQuiz();

    }, [videoId, user, firestore]);

    const handleQuizFinish = (score: number, answers: AnswerState[]) => {
        if (!quizDocRef) return;

        const userAnswers = answers.map(a => a.selectedAnswer || "");
        console.log("Saving score to Firestore:", { score, userAnswers });

        updateDocumentNonBlocking(quizDocRef, {
            score: score,
            userAnswers: userAnswers,
        });
    };

    if (isLoading) {
        return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Preparing Quiz...</CardTitle>
                    <CardDescription>Please wait while we prepare your questions.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
    if (error) {
        return (
            <Card className="w-full max-w-2xl border-destructive bg-destructive/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle/> Error</CardTitle>
                    <CardDescription className="text-destructive/80">{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Could not load or generate the quiz. This might happen if the video transcript is too short or if there was an issue with the AI service. Please try a different video.</p>
                </CardContent>
            </Card>
        )
    }
    
    if (!quizDoc || !quizDoc.questions || quizDoc.questions.length === 0) {
        return (
             <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>No Quiz Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>We couldn't generate a quiz for this video, it's possible the transcript was too short.</p>
                </CardContent>
            </Card>
        )
    }

    return <QuizView quizDoc={quizDoc} videoTitle={videoTitle} onQuizFinish={handleQuizFinish} />;
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
