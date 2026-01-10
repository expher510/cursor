
'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="text-2xl font-mono font-bold text-foreground">
            {formatTime(seconds)}
        </div>
    );
}

function ReadOutLoudController() {
    const { videoData } = useWatchPage();
    const { user, firestore } = useFirebase();
    const { userProfile } = useUserProfile();
    const { toast } = useToast();
    const { recorderState, startRecording, stopRecording, cancelRecording, audioData } = useRecorder();

    const [isSaving, setIsSaving] = useState(false);
    const [feedbackResult, setFeedbackResult] = useState<GenerateSpeechFeedbackOutput | null>(null);

    const handleReadOutLoudClick = () => {
        setFeedbackResult(null);
        startRecording();
    };
    
    const handleStopReadingOutLoud = () => {
        stopRecording();
    };
    
    const confirmReadOutLoud = async () => {
        if (!audioData?.url || !user || !firestore || !videoData?.videoId || !userProfile || !videoData.transcript) {
             toast({ variant: 'destructive', title: "Save failed", description: "Missing required data to save."});
             cancelRecording();
            return;
        }
        
        setIsSaving(true);
        setFeedbackResult(null);

        const fullTranscript = videoData.transcript.map(t => t.text).join(' ');

        try {
            const feedback = await generateSpeechFeedback({
                audioDataUri: audioData.url,
                originalText: fullTranscript,
                targetLanguage: userProfile.targetLanguage,
                nativeLanguage: userProfile.nativeLanguage,
            });

            setFeedbackResult(feedback);
            
            const attemptsCollection = collection(firestore, `users/${user.uid}/speakingAttempts`);
            await addDoc(attemptsCollection, {
                userId: user.uid,
                videoId: videoData.videoId,
                audioUrl: audioData.url,
                timestamp: Date.now(),
                originalText: fullTranscript,
                transcribedText: feedback.transcribedText,
                aiFeedback: {
                    accuracy: feedback.accuracy,
                    fluency: feedback.fluency,
                    pronunciation: feedback.pronunciation,
                },
            });
            toast({ title: "Recording Saved!", description: "Your speaking practice has been saved with AI feedback." });
        } catch(e: any) {
            console.error("Failed to save recording or get feedback", e);
            toast({ variant: 'destructive', title: "Save Failed", description: e.message || "There was an error saving your recording."});
        } finally {
            setIsSaving(false);
            cancelRecording();
        }
    };
    
    const cancelReadOutLoud = () => {
        cancelRecording();
        setFeedbackResult(null);
    }
    
    if (recorderState.status === 'idle' || recorderState.error) {
        return (
            <div className="flex flex-col items-center gap-4">
                <Button variant="outline" onClick={handleReadOutLoudClick} size="lg">
                    <Mic className="mr-2" />
                    Read Out Loud
                </Button>
                 {recorderState.error && <p className="text-sm text-destructive">{recorderState.error}</p>}
                 {feedbackResult && (
                    <Card className="w-full max-w-2xl bg-muted/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI Feedback (in {userProfile?.nativeLanguage})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                           <div>
                                <h4 className="font-semibold">What you said:</h4>
                                <p className="text-muted-foreground italic">"{feedbackResult.transcribedText}"</p>
                           </div>
                           <hr />
                           <div>
                                <h4 className="font-semibold">Accuracy</h4>
                                <p className="text-muted-foreground">{feedbackResult.accuracy}</p>
                           </div>
                            <div>
                                <h4 className="font-semibold">Fluency</h4>
                                <p className="text-muted-foreground">{feedbackResult.fluency}</p>
                           </div>
                            <div>
                                <h4 className="font-semibold">Pronunciation</h4>
                                <p className="text-muted-foreground">{feedbackResult.pronunciation}</p>
                           </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        )
    }

    return (
        <Card className="w-full max-w-2xl mx-auto p-4 transition-all">
            {recorderState.status === 'recording' && (
                <CardContent className="flex flex-col items-center justify-center gap-4 text-center p-0">
                    <div className="flex items-center gap-4">
                        <Mic className="h-8 w-8 text-destructive animate-pulse" />
                        <RecordingTimer isRecording={recorderState.status === 'recording'} />
                    </div>
                    <Button onClick={handleStopReadingOutLoud} size="lg" variant="destructive">
                        <StopCircle className="mr-2" />
                        Stop Recording
                    </Button>
                </CardContent>
            )}
             {recorderState.status === 'stopped' && (
                 <CardContent className="flex flex-col items-center justify-center gap-4 text-center p-0">
                     <h3 className="text-lg font-semibold">Recording Finished</h3>
                     <p className="text-muted-foreground text-sm">Save to get AI feedback or discard.</p>
                    <div className="flex gap-4 pt-2">
                         <Button onClick={confirmReadOutLoud} size="lg" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Check className="mr-2" />}
                            Confirm
                        </Button>
                        <Button onClick={cancelReadOutLoud} size="lg" variant="outline">
                            <X className="mr-2" />
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );

}


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const playerRef = useRef<ReactPlayer>(null);
    
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
        let lastPassedIndex = -1;
        for (let i = 0; i < transcript.length; i++) {
            if (transcript[i].offset <= currentTime) {
                lastPassedIndex = i;
            } else {
                break; 
            }
        }
        return lastPassedIndex;
    }, [videoData?.transcript, currentTime]);


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

    if (error || !videoData || !videoData.videoId || !videoData.transcript) {
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
            
             <div className="mb-4 text-center">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <div className="mt-2 space-y-4">
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Read the text, save new words, and listen along. Click any line to play its audio.
                    </p>
                    <ReadOutLoudController />
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
