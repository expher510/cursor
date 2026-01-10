
'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Pause, Play, RefreshCw, UploadCloud, X } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactPlayer from "react-player";


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
    
    const handleAudioEnd = () => {
        if (playerRef.current && duration > 0) {
            const seekToTime = duration > 3 ? duration - 3 : 0;
            playerRef.current.seekTo(seekToTime, 'seconds');
        }
    };

    const activeSegmentId = useMemo(() => {
        if (!videoData?.transcript) return null;

        // Find the index of the last line that has started
        let activeIndex = -1;
        for (let i = 0; i < videoData.transcript.length; i++) {
            if (videoData.transcript[i].offset <= currentTime) {
                activeIndex = i;
            } else {
                break; // Stop when we find a line that hasn't started yet
            }
        }
        
        if (activeIndex !== -1) {
            return `${videoData.videoId}-${activeIndex}`;
        }

        return null;
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

    if (error || !videoData || !videoData.videoId || !videoData.audioUrl) {
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
                <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
                    Read the text below, save new words, and listen along. Click any line to jump to that point in the audio.
                </p>
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
            <div className="hidden">
                 <ReactPlayer
                    ref={playerRef}
                    url={videoData.audioUrl}
                    playing={isPlaying}
                    onProgress={(state) => setCurrentTime(state.playedSeconds * 1000)}
                    onDuration={setDuration}
                    onEnded={handleAudioEnd}
                    width="0"
                    height="0"
                    controls={false}
                />
            </div>


            {/* Floating Action Buttons */}
             <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">

                {videoData.audioUrl && (
                    <Button
                        size="icon"
                        className="h-16 w-16 rounded-full shadow-lg"
                        onClick={handlePlayPause}
                    >
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                )}
            </div>
        </div>
    )
}

export default function ReadingPage() {
  return (
      <>
        <AppHeader showBackButton={true} />
        <main className="container mx-auto flex-1 p-4 md:p-6 pt-24 pb-24">
            <WatchPageProvider>
                <ReadingPracticePageContent />
            </WatchPageProvider>
        </main>
      </>
  );
}
