'use client';
import { Suspense } from 'react';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateQuiz, type QuizQuestion } from '@/ai/flows/generate-quiz-flow';
import { type TranscriptItem } from '@/ai/flows/process-video-flow';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type TranscriptDoc = {
    id: string;
    videoId: string;
    content: TranscriptItem[];
};


function QuizGenerator() {
    const searchParams = useSearchParams();
    const videoId = searchParams.get('v');

    const { firestore, user } = useFirebase();
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const transcriptDocRef = useMemoFirebase(() => {
        if (!user || !firestore || !videoId) return null;
        // The transcript document ID is the same as the video ID
        return doc(firestore, `users/${user.uid}/videos/${videoId}/transcripts`, videoId);
    }, [user, firestore, videoId]);

    const { data: transcriptData, isLoading: isLoadingTranscript, error: transcriptError } = useDoc<TranscriptDoc>(transcriptDocRef);

    const startQuiz = useCallback(async () => {
        if (!transcriptData || !transcriptData.content || transcriptData.content.length === 0) {
            setError("The transcript for this video is not available or is empty. A quiz cannot be generated.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setQuiz(null);
        setUserAnswers({});
        setShowResults(false);

        try {
            const result = await generateQuiz({ transcript: transcriptData.content });
            if (result.quiz && result.quiz.length > 0) {
                setQuiz(result.quiz);
            } else {
                setError("Failed to generate the quiz. The model returned no questions. Please try again.");
            }
        } catch (e: any) {
            console.error("Quiz generation failed", e);
            setError(e.message || "An unknown error occurred while generating the quiz.");
        } finally {
            setIsLoading(false);
        }
    }, [transcriptData]);

    useEffect(() => {
        if (transcriptData && !isLoadingTranscript) {
            startQuiz();
        }
        if (transcriptError) {
            setError(transcriptError.message);
            setIsLoading(false);
        }
        // Handle case where transcript is loading but then found to be empty
        if (!transcriptData && !isLoadingTranscript && !transcriptError) {
            setError("Could not find the transcript for this video.");
            setIsLoading(false);
        }
    }, [transcriptData, isLoadingTranscript, transcriptError, startQuiz]);


    const handleAnswer = (questionIndex: number, option: string) => {
        if (showResults) return;
        setUserAnswers(prev => ({ ...prev, [questionIndex]: option }));
    };

    const handleSubmit = () => {
        setShowResults(true);
    };

    const score = useMemo(() => {
        if (!showResults || !quiz) return 0;
        return quiz.reduce((correct, q, index) => {
            return userAnswers[index] === q.answer ? correct + 1 : correct;
        }, 0);
    }, [showResults, quiz, userAnswers]);


    if (isLoading || isLoadingTranscript) {
        return (
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating your quiz...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <Card className="w-full max-w-2xl text-center bg-destructive/10 border-destructive">
                 <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2">
                        <AlertTriangle />
                        Quiz Error
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        {error}
                    </p>
                    {videoId && (
                         <Button asChild variant="secondary">
                            <Link href={`/watch?v=${videoId}`}>Back to Video</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (!quiz) {
        return <p>No quiz available.</p>
    }

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Video Comprehension Quiz</CardTitle>
                <CardDescription>
                    {showResults ? `You scored ${score} out of ${quiz.length}!` : "Test your understanding of the video's content."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-6">
                    {quiz.map((q, index) => (
                        <div key={index}>
                            <p className="font-semibold mb-3 text-lg">{index + 1}. {q.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {q.options.map((option, i) => {
                                    const isSelected = userAnswers[index] === option;
                                    const isCorrect = option === q.answer;

                                    return (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            className={cn("justify-start h-auto py-3 text-base text-left",
                                                showResults && isCorrect && "bg-green-100 border-green-400 text-green-800 hover:bg-green-200",
                                                showResults && isSelected && !isCorrect && "bg-red-100 border-red-400 text-red-800 hover:bg-red-200",
                                                !showResults && isSelected && "bg-primary/10 border-primary"
                                            )}
                                            onClick={() => handleAnswer(index, option)}
                                        >
                                            {option}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-center gap-4">
                    {showResults ? (
                        <Button onClick={startQuiz}>Play Again</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={Object.keys(userAnswers).length !== quiz.length}>Submit Answers</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
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
