'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Mic, RefreshCw, X, UploadCloud } from "lucide-react";
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
import { cn } from "@/lib/utils";


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

function RecordingIndicator({ elapsedTime }: { elapsedTime: number }) {
    return (
        <div className="w-full max-w-4xl mx-auto text-center">
            <Card className="p-6">
                <div className="flex flex-col items-center gap-4">
                     <div className="flex items-center gap-3">
                         <div className="relative h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                         </div>
                         <p className="font-semibold text-destructive">Recording...</p>
                     </div>
                     <p className="text-4xl font-bold">{elapsedTime}s</p>
                </div>
            </Card>
        </div>
    );
}


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const [testState, setTestState] = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'finished'>('idle');
    const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    
    const { toast } = useToast();
    const { firestore, user } = useFirebase();

    useEffect(() => {
        // Cleanup function to stop recording and streams if the component unmounts
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        if (testState !== 'idle') return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setRecordedAudio(audioBlob);
                setTestState('recorded');
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setTestState('recording');
            setElapsedTime(0);
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Failed to get microphone access:", err);
            toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please allow microphone access in your browser settings to start the test.',
            });
            resetTest();
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
    
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

    const handleConfirmUpload = async () => {
        if (!recordedAudio || !firestore || !user || !videoData?.videoId) return;

        setTestState('uploading');
        try {
            const audioDataUrl = await blobToBase64(recordedAudio);
            const attemptCollectionRef = collection(firestore, `users/${user.uid}/speakingAttempts`);
            const docRef = await addDoc(attemptCollectionRef, {
                userId: user.uid,
                videoId: videoData.videoId,
                audioUrl: audioDataUrl,
                timestamp: Date.now(),
            });
            setLastAttemptId(docRef.id);
            setTestState('finished');
        } catch (e: any) {
            console.error("Failed to upload recording:", e);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not save your recording. Please try again.' });
            setTestState('recorded');
        }
    };

    const handleTestComplete = (attemptId: string) => {
        if (attemptId) {
            setLastAttemptId(attemptId);
            setTestState('finished');
        } else {
            resetTest();
        }
    };
    
    const resetTest = () => {
        stopRecording();
        setTestState('idle');
        setLastAttemptId(null);
        setRecordedAudio(null);
        setElapsedTime(0);
        audioChunksRef.current = [];
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
                        {testState === 'idle' && "Read the text below, save new words, then test your pronunciation."}
                        {testState === 'recording' && "Read the text aloud. Press the floating button to stop."}
                        {testState === 'recorded' && "Review your recording or upload it for feedback."}
                        {testState === 'uploading' && "Uploading your recording..."}
                    </p>
                </div>
            )}

            {testState === 'idle' && (
                <>
                    <div className="my-6 flex justify-center">
                       <Button size="lg" className="rounded-full" onClick={startRecording}>
                            <Mic className="mr-2 h-5 w-5" />
                            Read Out Loud
                       </Button>
                    </div>
                    <VocabularyList layout="scroll" />
                </>
            )}

            {testState === 'recording' && (
                <>
                    <div className="my-6">
                        <RecordingIndicator elapsedTime={elapsedTime} />
                    </div>
                    <Button
                        size="icon"
                        variant="destructive"
                        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 animate-pulse"
                        onClick={stopRecording}
                    >
                        <X className="h-8 w-8" />
                    </Button>
                </>
            )}

             {testState === 'recorded' && recordedAudio && (
                <div className="my-6 text-center">
                    <p className="font-semibold mb-2">Your recording is ready:</p>
                    <audio src={URL.createObjectURL(recordedAudio)} controls className="w-full max-w-sm mx-auto" />
                </div>
            )}
             
            {testState === 'uploading' && (
                <div className="my-6 flex justify-center items-center flex-col gap-4">
                     <Loader2 className="h-10 w-10 animate-spin text-primary" />
                     <p className="text-muted-foreground">Analyzing your speech...</p>
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

            {testState === 'recorded' && (
                 <div className="w-full flex justify-center items-center gap-4 mt-8 py-4 border-t">
                    <Button variant="outline" onClick={resetTest}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Record Again
                    </Button>
                    <Button onClick={handleConfirmUpload} size="lg">
                        <UploadCloud className="mr-2 h-5 w-5" />
                        Confirm & Upload
                    </Button>
                </div>
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
