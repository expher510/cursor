'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Mic, RefreshCw } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useFirebase } from "@/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { Loader2 } from "lucide-react";


function SpeakingTestFeedback({ attemptId, onRetry }: { attemptId: string; onRetry: () => void }) {
    const { firestore, user } = useFirebase();
    const [attemptData, setAttemptData] = useState<{ audioUrl: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user || !attemptId) return;
        const fetchAttempt = async () => {
            setIsLoading(true);
            const docRef = doc(firestore, `users/${user.uid}/speakingAttempts`, attemptId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setAttemptData(docSnap.data() as { audioUrl: string });
            }
            setIsLoading(false);
        };
        fetchAttempt();
    }, [firestore, user, attemptId]);

    const feedback = {
        score: 85,
        strengths: "Good pace and clear articulation on most words.",
        areasForImprovement: "Slight hesitation on complex words like 'inventions'. Try to maintain a consistent flow.",
    };

    if (isLoading) {
        return (
             <Card className="w-full max-w-4xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle>Loading Your Results...</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (!attemptData) {
        return <p>Could not load test results.</p>;
    }


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
                    <audio src={attemptData.audioUrl} controls className="w-full max-w-sm mx-auto mt-2" />
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

function SpeakingTestRecorder({ videoId, onTestComplete, onStart }: { videoId: string, onTestComplete: (attemptId: string) => void, onStart: () => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPreparing, setIsPreparing] = useState(true);
    const [duration, setDuration] = useState(30);
    const [timeLeft, setTimeLeft] = useState(30);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();
    const { firestore, user } = useFirebase();
    const startAttempted = useRef(false);

    const startRecording = async () => {
        setIsPreparing(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            
            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                if (firestore && user) {
                    const audioDataUrl = await blobToBase64(audioBlob);
                    const attemptCollectionRef = collection(firestore, `users/${user.uid}/speakingAttempts`);
                    const docRef = await addDoc(attemptCollectionRef, {
                        userId: user.uid,
                        videoId: videoId,
                        audioUrl: audioDataUrl,
                        timestamp: Date.now(),
                    });
                    onTestComplete(docRef.id);
                }
                
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop()); // Release microphone
            };
            
            const randomDuration = Math.floor(Math.random() * (45 - 15 + 1)) + 15;
            setDuration(randomDuration);
            setTimeLeft(randomDuration);
            
            recorder.start();
            setIsRecording(true);

        } catch (err) {
            console.error("Failed to get microphone access:", err);
            toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please allow microphone access in your browser settings to start the test.',
            });
            onTestComplete(''); // Abort test
        } finally {
            setIsPreparing(false);
        }
    };
    
    useEffect(() => {
        onStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect(() => {
        if (onStart && !startAttempted.current) {
            startAttempted.current = true;
            startRecording();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onStart]);


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

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = error => reject(error);
        });
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    const progress = (timeLeft / duration) * 100;

    return (
        <div className="w-full max-w-4xl mx-auto text-center">
            <Card className="p-6">
                <div className="flex flex-col items-center gap-4">
                    {isPreparing ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="animate-spin mr-2" />
                            <p>Getting microphone ready...</p>
                        </div>
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
        </div>
    );
}

function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const [testState, setTestState] = useState<'idle' | 'testing' | 'finished'>('idle');
    const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);

    const handleTestComplete = (attemptId: string) => {
        if (attemptId) {
            setLastAttemptId(attemptId);
            setTestState('finished');
        } else {
            // If attemptId is empty, it means mic access was denied or failed. Reset to idle.
            resetTest();
        }
    };
    
    const resetTest = () => {
        setTestState('idle');
        setLastAttemptId(null);
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

    if (error || !videoData || !videoData.videoId) {
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
                            Read Out Loud
                       </Button>
                    </div>
                    <VocabularyList layout="scroll" />
                </>
            )}

            {testState === 'testing' && (
                 <div className="my-6">
                    <SpeakingTestRecorder 
                        videoId={videoData.videoId} 
                        onTestComplete={handleTestComplete} 
                        onStart={() => {}}
                    />
                 </div>
            )}

            {testState === 'finished' && lastAttemptId && (
                <SpeakingTestFeedback attemptId={lastAttemptId} onRetry={resetTest} />
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
            <WatchPageProvider>
                <ReadingPracticePageContent />
            </WatchPageProvider>
        </main>
      </>
  );
}
