'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Mic, RefreshCw, Square } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";


function SpeakingTestFeedback({ audioUrl, onRetry }: { audioUrl: string, onRetry: () => void }) {
    const feedback = {
        score: 85,
        strengths: "Good pace and clear articulation on most words.",
        areasForImprovement: "Slight hesitation on complex words like 'inventions'. Try to maintain a consistent flow.",
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
                <CardTitle>Speaking Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <p className="text-center text-5xl font-bold">{feedback.score}<span className="text-xl text-muted-foreground">/100</span></p>
                    <Progress value={feedback.score} className="w-1/2 mx-auto" />
                </div>
                 <div className="text-center">
                    <p className="font-semibold">Your Recording:</p>
                    <audio src={audioUrl} controls className="w-full max-w-sm mx-auto mt-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-green-100/50 rounded-lg">
                        <h4 className="font-semibold text-green-800">What you did well:</h4>
                        <p className="text-sm text-green-700">{feedback.strengths}</p>
                    </div>
                     <div className="p-4 bg-amber-100/50 rounded-lg">
                        <h4 className="font-semibold text-amber-800">Areas for Improvement:</h4>
                        <p className="text-sm text-amber-700">{feedback.areasForImprovement}</p>
                    </div>
                </div>
                <div className="text-center pt-4">
                    <Button onClick={onRetry}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function SpeakingTestRecorder({ onTestComplete }: { onTestComplete: (audioUrl: string) => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isRecording && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isRecording && timeLeft === 0) {
            stopRecording();
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecording, timeLeft]);

    const startRecording = async () => {
        setIsPreparing(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            
            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                onTestComplete(audioUrl);
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop()); // Release microphone
            };
            
            recorder.start();
            setIsRecording(true);
            setTimeLeft(30);
        } catch (err) {
            console.error("Failed to get microphone access:", err);
            toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please allow microphone access in your browser settings to start the test.',
            });
        } finally {
            setIsPreparing(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const progress = (timeLeft / 30) * 100;

    return (
        <div className="w-full max-w-4xl mx-auto text-center">
            {!isRecording && !isPreparing && (
                <Button size="lg" className="rounded-full" onClick={startRecording}>
                    <Mic className="mr-2 h-5 w-5" />
                    Start Speaking Test
                </Button>
            )}
            
            {(isRecording || isPreparing) && (
                 <Card className="p-6">
                    <div className="flex flex-col items-center gap-4">
                        {isPreparing ? (
                            <p>Getting microphone ready...</p>
                        ) : (
                           <>
                             <div className="flex items-center gap-3">
                                 <div className="relative h-2 w-2">
                                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                     <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                                 </div>
                                 <p className="font-semibold text-destructive">Recording...</p>
                             </div>
                             <p className="text-4xl font-bold">{timeLeft}s</p>
                             <Progress value={progress} className="w-full" />
                           </>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}

function ReadingPracticePage() {
    const { videoData, isLoading, error } = useWatchPage();
    const [testState, setTestState] = useState<'idle' | 'testing' | 'finished'>('idle');
    const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

    const handleTestComplete = (audioUrl: string) => {
        setRecordedAudioUrl(audioUrl);
        setTestState('finished');
    };
    
    const resetTest = () => {
        setTestState('idle');
        setRecordedAudioUrl(null);
    }


    if (isLoading) {
        return (
             <div className="w-full max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-5/6" />
                        <Skeleton className="h-5 w-full" />
                    </CardContent>
                </Card>
             </div>
        )
    }

    if (error || !videoData) {
        return (
            <Card className="max-w-md mx-auto text-center border-destructive bg-destructive/10">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-destructive">
                    <AlertTriangle />
                    Error Loading Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{error || "Could not load reading material. Please go back and select a video first."}</p>
              </CardContent>
            </Card>
        );
    }
    
    const formattedTranscript = videoData.transcript.map(item => ({
        ...item,
        text: item.text,
    }));


    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            
            {testState !== 'finished' && (
                <div className="mb-4 text-center">
                    <div className="flex justify-center">
                        <Logo />
                    </div>
                    <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
                        {testState === 'idle' 
                          ? "Read the text below, save new words, then test your pronunciation."
                          : "Read the text aloud. The recording will stop automatically."
                        }
                    </p>
                </div>
            )}


            {testState === 'idle' && (
                <>
                    <div className="my-6 flex justify-center">
                       <Button size="lg" className="rounded-full" onClick={() => setTestState('testing')}>
                            <Mic className="mr-2 h-5 w-5" />
                            Start Speaking Test
                       </Button>
                    </div>
                    <VocabularyList layout="scroll" />
                </>
            )}

            {testState === 'testing' && (
                 <div className="my-6">
                    <SpeakingTestRecorder onTestComplete={handleTestComplete} />
                 </div>
            )}

            {testState === 'finished' && recordedAudioUrl && (
                <SpeakingTestFeedback audioUrl={recordedAudioUrl} onRetry={resetTest} />
            )}

            
            {testState !== 'finished' && (
                <Card>
                    <TranscriptView transcript={formattedTranscript} videoId={videoData.videoId} />
                </Card>
            )}

        </div>
    )
}

export default function ReadingPage() {
  return (
      <>
        <AppHeader showBackButton={true} />
        <main className="container mx-auto flex-1 p-4 md:p-6 pt-24">
            <ReadingPracticePage />
        </main>
      </>
  );
}
