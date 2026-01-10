'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Pause, Play, BookOpenCheck, Mic, BrainCircuit } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useRef, useCallback, useMemo } from "react";
import ReactPlayer from "react-player";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const playerRef = useRef<ReactPlayer>(null);

    const [isExerciseMode, setIsExerciseMode] = useState(false);
    const [currentExerciseSegment, setCurrentExerciseSegment] = useState<number | null>(null);

    const handlePlayPause = () => {
        setIsPlaying(prev => !prev);
    };

    const handlePlaySegment = useCallback((offset: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(offset / 1000, 'seconds');
            setIsPlaying(true);
        }
    }, []);

    const activeSegmentId = useMemo(() => {
        if (!videoData?.transcript) return null;
        
        // If in exercise mode, the active segment is the one being exercised
        if (isExerciseMode && currentExerciseSegment !== null) {
            return `${videoData.videoId}-${currentExerciseSegment}`;
        }

        // Otherwise, it's based on audio playback time
        let activeIndex = -1;
        for (let i = 0; i < videoData.transcript.length; i++) {
            if (videoData.transcript[i].offset <= currentTime) {
                activeIndex = i;
            } else {
                break;
            }
        }
        
        if (activeIndex !== -1) {
            return `${videoData.videoId}-${activeIndex}`;
        }

        return null;
    }, [currentTime, videoData?.transcript, videoData?.videoId, isExerciseMode, currentExerciseSegment]);

    const startExercise = () => {
        setIsExerciseMode(true);
        setCurrentExerciseSegment(0);
        handlePlaySegment(videoData?.transcript[0]?.offset ?? 0);
    };

    const finishExercise = () => {
        setIsExerciseMode(false);
        setCurrentExerciseSegment(null);
        setIsPlaying(false);
    };


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
                 {isExerciseMode ? (
                    <div className="mt-2 space-y-2">
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            <span className="font-semibold text-primary">Shadowing Mode:</span> Listen to the current segment, then record yourself repeating it.
                        </p>
                        <Button onClick={finishExercise} variant="secondary">Finish Exercise</Button>
                    </div>
                ) : (
                    <div className="mt-2 space-y-2">
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                           Read the text, save new words, and listen along. Click any line to play its audio.
                        </p>
                        <Button onClick={startExercise}>
                            <BrainCircuit className="mr-2 h-5 w-5"/> Start Shadowing Exercise
                        </Button>
                    </div>
                 )}
            </div>
            
            <>
                <VocabularyList layout="scroll" />
                <Card>
                    <TranscriptView 
                       transcript={formattedTranscript} 
                       videoId={videoData.videoId}
                       onPlaySegment={handlePlaySegment}
                       activeSegmentId={activeSegmentId}
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
                        onProgress={(state) => setCurrentTime(state.playedSeconds * 1000)}
                        onDuration={setDuration}
                        width="0"
                        height="0"
                        controls={false}
                    />
                </div>
            )}


            {/* Floating Action Buttons */}
            {isExerciseMode && (
                 <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
                    <Button
                        size="icon"
                        className="h-16 w-16 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600"
                        onClick={() => currentExerciseSegment !== null && handlePlaySegment(videoData.transcript[currentExerciseSegment].offset)}
                    >
                        <Play className="h-8 w-8" />
                    </Button>
                     <Button
                        size="icon"
                        className="h-16 w-16 rounded-full shadow-lg bg-red-500 hover:bg-red-600"
                        onClick={() => alert("Recording feature coming soon!")}
                    >
                        <Mic className="h-8 w-8" />
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
        <main className="container mx-auto flex-1 p-4 md:p-6 pt-24 pb-24">
            <Suspense fallback={<div className="flex justify-center items-center h-full"><p>Loading...</p></div>}>
                <PageWithProvider />
            </Suspense>
        </main>
      </>
  );
}
