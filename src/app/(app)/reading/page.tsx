
'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BrainCircuit, Check, Mic, Play, Pause, Trash2, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useRef, useCallback, useMemo } from "react";
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


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const { user, firestore } = useFirebase();
    const { userProfile } = useUserProfile();
    const { toast } = useToast();
    const { recorderState, startRecording, stopRecording, cancelRecording, audioData } = useRecorder();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const playerRef = useRef<ReactPlayer>(null);
    const [isShadowing, setIsShadowing] = useState(false);
    const [segmentToLoop, setSegmentToLoop] = useState<{ start: number, duration: number, text: string } | null>(null);
    
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackResult, setFeedbackResult] = useState<GenerateSpeechFeedbackOutput | null>(null);

    const handlePlayPause = () => {
        setIsPlaying(prev => !prev);
    };

    const handlePlaySegment = useCallback((offset: number, duration: number, text: string) => {
        if (playerRef.current) {
            if (recorderState.status === 'recording' || recorderState.status === 'stopped') return;

            if (isShadowing) {
                setSegmentToLoop({ start: offset / 1000, duration: duration / 1000, text });
                 playerRef.current.seekTo(offset / 1000, 'seconds');
                 setIsPlaying(true);
            } else {
                setSegmentToLoop(null); // Ensure no looping in normal mode
                playerRef.current.seekTo(offset / 1000, 'seconds');
                setIsPlaying(true);
            }
        }
    }, [isShadowing, recorderState.status]);

    const activeSegmentIndex = useMemo(() => {
        const transcript = videoData?.transcript;
        if (!transcript || transcript.length === 0) {
            return -1;
        }

        // Find the currently active line based on currentTime
        for (let i = 0; i < transcript.length; i++) {
            const line = transcript[i];
            const startTime = line.offset;
            const endTime = startTime + line.duration;
            if (currentTime >= startTime && currentTime < endTime) {
                return i;
            }
        }
        
        // Fallback for when between lines, find the last line that has passed
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

    const handleToggleShadowing = () => {
      setIsShadowing(prev => {
        const newMode = !prev;
        if (!newMode) {
          setSegmentToLoop(null);
          cancelRecording();
        }
        setIsPlaying(false);
        setFeedbackResult(null);
        return newMode;
      });
    }

    const handleRecordClick = () => {
      if (recorderState.status === 'idle' || recorderState.status === 'stopped') {
        setIsPlaying(false);
        setSegmentToLoop(null);
        startRecording();
        setFeedbackResult(null);
      } else if (recorderState.status === 'recording') {
        stopRecording();
      }
    };
    
    const saveRecording = async () => {
        if (!audioData?.url || !user || !firestore || !videoData?.videoId || !segmentToLoop?.text || !userProfile) {
             toast({ variant: 'destructive', title: "Save failed", description: "Missing required data to save and get feedback."});
            return;
        }
        
        setIsSaving(true);
        try {
            const feedback = await generateSpeechFeedback({
                audioDataUri: audioData.url,
                originalText: segmentToLoop.text,
                targetLanguage: userProfile.targetLanguage,
            });
            
            setFeedbackResult(feedback);

            const attemptsCollection = collection(firestore, `users/${user.uid}/speakingAttempts`);
            await addDoc(attemptsCollection, {
                userId: user.uid,
                videoId: videoData.videoId,
                audioUrl: audioData.url,
                timestamp: Date.now(),
                aiFeedback: feedback,
                originalText: segmentToLoop.text
            });
            toast({ title: "Feedback Received!", description: "Your speaking practice and AI feedback have been saved." });
        } catch(e: any) {
            console.error("Failed to get feedback or save recording", e);
            toast({ variant: 'destructive', title: "Feedback Failed", description: e.message || "There was an error getting feedback."});
        } finally {
            setIsSaving(false);
            cancelRecording();
        }
    };

    const handleCancel = () => {
        cancelRecording();
        setFeedbackResult(null);
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
            
             <div className="mb-4 text-center">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <div className="mt-2 space-y-4">
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                       {isShadowing 
                         ? "Shadowing Mode: Click a line to loop its audio, then record yourself."
                         : "Read the text, save new words, and listen along. Click any line to play its audio."
                       }
                    </p>
                    <Button variant={isShadowing ? "secondary" : "outline"} onClick={handleToggleShadowing} size="lg">
                      <BrainCircuit className={cn("mr-2", isShadowing && "text-primary")} />
                      {isShadowing ? "Exit Shadowing" : "Shadowing Practice"}
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
            
            {feedbackResult && (
                 <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            AI Feedback
                        </CardTitle>
                        <CardDescription>Here's the analysis of your recording.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold">You said:</h4>
                            <p className="text-muted-foreground italic">"{feedbackResult.transcribedText}"</p>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-semibold">Accuracy</h4>
                                <p className="text-muted-foreground text-sm">{feedbackResult.accuracy}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Fluency</h4>
                                <p className="text-muted-foreground text-sm">{feedbackResult.fluency}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Pronunciation</h4>
                                <p className="text-muted-foreground text-sm">{feedbackResult.pronunciation}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Hidden Audio Player */}
            {videoData.audioUrl && (
                <div className="hidden">
                    <ReactPlayer
                        ref={playerRef}
                        url={videoData.audioUrl}
                        playing={isPlaying}
                        onProgress={(state) => {
                          setCurrentTime(state.playedSeconds * 1000);
                          if (segmentToLoop && state.playedSeconds >= segmentToLoop.start + segmentToLoop.duration) {
                            playerRef.current?.seekTo(segmentToLoop.start, 'seconds');
                          }
                        }}
                        onEnded={() => {
                           if (!segmentToLoop) {
                                setIsPlaying(false);
                           }
                        }}
                        width="0"
                        height="0"
                        controls={false}
                    />
                </div>
            )}
            
            {!isShadowing && videoData.audioUrl && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <Button onClick={handlePlayPause} size="lg" className="rounded-full h-16 w-16 shadow-lg">
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                </div>
            )}


            {isShadowing && (
                 <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-4">
                     <div className={cn(
                         "flex flex-col gap-3 transition-all duration-300",
                         recorderState.status === 'stopped' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                     )}>
                         <Button size="icon" className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700" onClick={saveRecording} disabled={isSaving}>
                             {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Check className="h-6 w-6" />}
                         </Button>
                         <Button size="icon" variant="destructive" className="h-12 w-12 rounded-full" onClick={handleCancel} disabled={isSaving}>
                             <Trash2 className="h-6 w-6" />
                         </Button>
                     </div>
                     <Button
                        onClick={handleRecordClick}
                        size="lg"
                        disabled={recorderState.status === 'stopped' || !segmentToLoop}
                        className={cn(
                            "h-20 w-20 rounded-full shadow-lg",
                            {
                                'bg-muted-foreground': !segmentToLoop,
                                'bg-red-600 hover:bg-red-700 animate-pulse': recorderState.status === 'recording',
                                'bg-primary': recorderState.status !== 'recording' && recorderState.status !== 'stopped' && segmentToLoop,
                                'bg-muted-foreground': recorderState.status === 'stopped',
                            }
                        )}
                    >
                        <Mic className="h-10 w-10" />
                        <span className="sr-only">{recorderState.status === 'recording' ? 'Stop Recording' : 'Record'}</span>
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
