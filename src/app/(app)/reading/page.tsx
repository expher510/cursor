
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


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const playerRef = useRef<ReactPlayer>(null);

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
        if (!videoData?.transcript || videoData.transcript.length === 0) return null;

        const transcript = videoData.transcript;
        
        // Iterate backwards to find the last segment that has started
        for (let i = transcript.length - 1; i >= 0; i--) {
            if (transcript[i].offset <= currentTime) {
                return `${videoData.videoId}-${i}`;
            }
        }
        
        return null; // Nothing is active if before the first offset
    }, [currentTime, videoData?.transcript, videoData?.videoId]);


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
                <div className="mt-2 space-y-2">
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                       Read the text, save new words, and listen along. Click any line to play its audio.
                    </p>
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
            {videoData.audioUrl && (
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
