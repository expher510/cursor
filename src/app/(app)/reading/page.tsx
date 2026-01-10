
'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BrainCircuit, Check, Mic, Play, Pause, Trash2, Loader2, Sparkles, CheckCircle, StopCircle, X } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import ReactPlayer from "react-player";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRecorder } from "@/hooks/use-recorder";
import { useFirebase } from "@/firebase";
import { addDoc, collection } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { generateSpeechFeedback, type GenerateSpeechFeedbackOutput } from "@/ai/flows/generate-speech-feedback-flow";


function RecordingTimer({ isRecording }: { isRecording: boolean }) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRecording) {
            setSeconds(0);
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        } else {
            if (interval) {
                clearInterval(interval);
            }
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isRecording]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60).toString().padStart(2, '0');
        const seconds = (time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <div className="text-4xl font-mono font-bold text-foreground">
            {formatTime(seconds)}
        </div>
    );
}


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const { user, firestore } = useFirebase();
    const { userProfile } = useUserProfile();
    const { toast } = useToast();
    const { recorderState, startRecording, stopRecording, cancelRecording, audioData } = useRecorder();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const playerRef = useRef<ReactPlayer>(null);
    
    const [isReadingOutLoud, setIsReadingOutLoud] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [feedbackResult, setFeedbackResult] = useState<GenerateSpeechFeedbackOutput | null>(null);

    const handlePlayPause = () => {
        setIsPlaying(prev => !prev);
    };

    const handlePlaySegment = useCallback((offset: number, duration: number, text: string) => {
        if (playerRef.current) {
            playerRef.current.seekTo(offset / 1000, 'seconds');
            setIsPlaying(true);
        }
    }, []);

    const activeSegmentIndex = useMemo(() => {
        const transcript = videoData?.transcript;
        if (!transcript || transcript.length === 0) {
            return -1;
        }

        // Find the index of the last line that has started
        let lastPassedIndex = -1;
        for (let i = 0; i < transcript.length; i++) {
            if (transcript[i].offset <= currentTime) {
                lastPassedIndex = i;
            } else {
                break; // We've passed the current time
            }
        }
        
        return lastPassedIndex;

    }, [videoData?.transcript, currentTime]);
    
    const handleReadOutLoudClick = () => {
        setIsReadingOutLoud(true);
        startRecording();
    };
    
    const handleStopReadingOutLoud = () => {
        stopRecording();
    };
    
    const confirmReadOutLoud = async () => {
        if (!audioData?.url || !user || !firestore || !videoData?.videoId || !userProfile) {
             toast({ variant: 'destructive', title: "Save failed", description: "Missing required data to save."});
             setIsReadingOutLoud(false);
             cancelRecording();
            return;
        }
        
        setIsSaving(true);
        try {
            const attemptsCollection = collection(firestore, `users/${user.uid}/speakingAttempts`);
            await addDoc(attemptsCollection, {
                userId: user.uid,
                videoId: videoData.videoId,
                audioUrl: audioData.url,
                timestamp: Date.now(),
                originalText: "Read out loud practice",
            });
            toast({ title: "Recording Saved!", description: "Your speaking practice has been saved." });
        } catch(e: any) {
            console.error("Failed to save recording", e);
            toast({ variant: 'destructive', title: "Save Failed", description: e.message || "There was an error saving your recording."});
        } finally {
            setIsSaving(false);
            cancelRecording();
            setIsReadingOutLoud(false);
        }
    };
    
    const cancelReadOutLoud = () => {
        cancelRecording();
        setIsReadingOutLoud(false);
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
    
    if (isReadingOutLoud) {
        return (
            <div className="w-full max-w-2xl mx-auto">
                 <Card className="text-center p-8">
                    <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[300px]">
                        {recorderState.status === 'recording' && (
                             <>
                                <div className="relative">
                                    <Mic className="h-20 w-20 text-destructive animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-semibold text-muted-foreground">Recording...</h3>
                                <RecordingTimer isRecording={recorderState.status === 'recording'} />
                                <Button onClick={handleStopReadingOutLoud} size="lg" variant="destructive">
                                    <StopCircle className="mr-2" />
                                    Stop Recording
                                </Button>
                            </>
                        )}
                        {recorderState.status === 'stopped' && (
                            <>
                                 <h3 className="text-2xl font-semibold">Recording Finished</h3>
                                 <p className="text-muted-foreground">Save or discard your recording.</p>
                                <div className="flex gap-4 pt-4">
                                     <Button onClick={confirmReadOutLoud} size="lg" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Check className="mr-2" />}
                                        Confirm
                                    </Button>
                                    <Button onClick={cancelReadOutLoud} size="lg" variant="outline">
                                        <X className="mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                 </Card>
            </div>
        )
    }
    
    const formattedTranscript = videoData.transcript.map(item => ({
        ...item,
        text: item.text,
    }));


    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            
             <div className="mb-4 text-center">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <div className="mt-2 space-y-4">
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Read the text, save new words, and listen along. Click any line to play its audio.
                    </p>
                    <Button variant="outline" onClick={handleReadOutLoudClick} size="lg">
                      <Mic className={cn("mr-2")} />
                      Read Out Loud
                    </Button>
                </div>
            </div>
            
            <>
                <VocabularyList layout="scroll" />
                <Card>
                    <TranscriptView 
                       transcript={formattedTranscript} 
                       videoId={videoData.videoId}
                       onPlaySegment={handlePlaySegment}
                       activeSegmentIndex={activeSegmentIndex}
                    />
                </Card>
            </>

            {/* Hidden Audio Player */}
            {videoData.audioUrl && (
                <div className="hidden">
                    <ReactPlayer
                        ref={playerRef}
                        url={videoData.audioUrl}
                        playing={isPlaying}
                        onProgress={(state) => {
                            setCurrentTime(state.playedSeconds * 1000);
                        }}
                        onEnded={() => {
                            setIsPlaying(false);
                        }}
                        width="0"
                        height="0"
                        controls={false}
                    />
                </div>
            )}
            
            {videoData.audioUrl && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <Button onClick={handlePlayPause} size="lg" className="rounded-full h-16 w-16 shadow-lg">
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                </div>
            )}

        </div>
    )
}

function PageWithProvider() {
    const searchParams = useSearchParams();
    const videoId = searchParams.get('v');
    const shouldGenerate = searchParams.get('shouldGenerate');
    const key = `${videoId}-${shouldGenerate}`;

    return (
        <WatchPageProvider key={key}>
            <ReadingPracticePageContent />
        </WatchPageProvider>
    );
}

export default function ReadingPage() {
  return (
      <>
        <AppHeader showBackButton={true} />
        <main className="container mx-auto flex-1 p-4 md:p-6 pt-24 pb-32">
            <Suspense fallback={<div className="flex justify-center items-center h-full"><p>Loading...</p></div>}>
                <PageWithProvider />
            </Suspense>
        </main>
      </>
  );
}
