'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Pause, Play, BookOpenCheck, Mic, BrainCircuit, Volume2, VolumeX } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useRef, useCallback, useMemo } from "react";
import ReactPlayer from "react-player";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const playerRef = useRef<ReactPlayer>(null);
    const [isShadowing, setIsShadowing] = useState(false);
    const [segmentToLoop, setSegmentToLoop] = useState<{ start: number, duration: number } | null>(null);

    const handlePlayPause = () => {
        setIsPlaying(prev => !prev);
    };

    const handlePlaySegment = useCallback((offset: number, duration: number) => {
        if (playerRef.current) {
            if (isShadowing) {
                setSegmentToLoop({ start: offset / 1000, duration: duration / 1000 });
            }
            playerRef.current.seekTo(offset / 1000, 'seconds');
            setIsPlaying(true);
        }
    }, [isShadowing]);

    const activeSegmentId = useMemo(() => {
        const transcript = videoData?.transcript;
        if (!transcript || transcript.length === 0) {
            return null;
        }

        // Find the index of the first segment that starts AFTER the current time.
        let nextSegmentIndex = -1;
        let left = 0;
        let right = transcript.length - 1;

        while (left <= right) {
            const mid = Math.floor(left + (right - left) / 2);
            if (transcript[mid].offset > currentTime) {
                nextSegmentIndex = mid;
                right = mid - 1; // Look for an earlier segment that's also in the future
            } else {
                left = mid + 1; // This segment has already started, look later
            }
        }
        
        let activeIndex;
        if (nextSegmentIndex === -1) {
            // If no segment is in the future, we're at the last segment.
            activeIndex = transcript.length - 1;
        } else if (nextSegmentIndex === 0) {
            // If the first segment is in the future, nothing is active yet.
            activeIndex = -1;
        } else {
            // The active segment is the one right before the "next" one.
            activeIndex = nextSegmentIndex - 1;
        }

        return activeIndex !== -1 ? `${videoData?.videoId}-${activeIndex}` : null;
    }, [videoData?.transcript, videoData?.videoId, currentTime]);

    const handleToggleShadowing = () => {
      setIsShadowing(prev => {
        const newMode = !prev;
        if (!newMode) {
          // When turning off shadowing, stop any looping.
          setSegmentToLoop(null);
        }
        return newMode;
      });
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
                         ? "Shadowing Mode: Click a line to loop its audio and practice along."
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
                       activeSegmentId={activeSegmentId}
                    />
                </Card>
            </>

            {/* Floating Audio Player Button */}
            {videoData.audioUrl && !isShadowing && (
                <Button 
                    onClick={handlePlayPause} 
                    size="lg"
                    className="fixed bottom-8 right-8 z-50 h-16 w-16 rounded-full shadow-lg"
                    disabled={!videoData.audioUrl}
                >
                    {isPlaying ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
                    <span className="sr-only">{isPlaying ? 'Pause Audio' : 'Play Audio'}</span>
                </Button>
            )}

            {/* Shadowing UI */}
            {isShadowing && (
                 <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-4">
                     <Button 
                        size="lg"
                        className="h-20 w-20 rounded-full shadow-lg bg-red-600 hover:bg-red-700"
                    >
                        <Mic className="h-10 w-10" />
                        <span className="sr-only">Record</span>
                    </Button>
                </div>
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
                        onDuration={setDuration}
                        width="0"
                        height="0"
                        controls={false}
                        loop={isShadowing}
                    />
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
