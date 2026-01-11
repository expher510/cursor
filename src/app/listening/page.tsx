
'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2, Play, Pause, Circle } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ReactPlayer from 'react-player/youtube';


function ListeningPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
    const playerRef = useRef<ReactPlayer>(null);
    
    useEffect(() => {
      if (!videoData?.transcript) return;
      
      let activeIndex = -1;
      for (let i = 0; i < videoData.transcript.length; i++) {
          if (videoData.transcript[i].offset <= currentTime) {
              activeIndex = i;
          } else {
              break;
          }
      }
      setActiveSegmentIndex(activeIndex);

    }, [currentTime, videoData?.transcript]);

    if (isLoading) {
        return (
             <div className="w-full max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <div className="flex justify-center">
                    <Skeleton className="h-32 w-32 rounded-full" />
                </div>
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
                <p className="text-muted-foreground">{error || "Could not load listening material. Please go back and select a video first."}</p>
              </CardContent>
            </Card>
        );
    }
    
    const formattedTranscript = videoData.transcript.map(item => ({
        ...item,
        text: item.text,
    }));
    
    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    }
    
    const playSegment = (offset: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(offset / 1000);
            setIsPlaying(true);
        }
    };


    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div style={{ display: 'none' }}>
                <ReactPlayer
                    ref={playerRef}
                    url={`https://www.youtube.com/watch?v=${videoData.videoId}`}
                    playing={isPlaying}
                    onProgress={(progress) => setCurrentTime(progress.playedSeconds * 1000)}
                    onEnded={() => setIsPlaying(false)}
                    controls={false}
                    width="0"
                    height="0"
                />
            </div>
            
             <div className="mb-8 text-center">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <div className="mt-2 space-y-4">
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Focus on your listening. Click the play button to start the audio, and follow along with the text. Click the dot <Circle className="inline-block h-5 w-5 border-2 rounded-full p-0.5 align-middle" /> to translate a sentence.
                    </p>
                </div>
            </div>

            <div className="flex justify-center my-8">
                 <Button onClick={handlePlayPause} size="lg" className="h-24 w-24 rounded-full">
                    {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10" />}
                 </Button>
            </div>
            
            <>
                <VocabularyList layout="scroll" />
                <Card>
                    <TranscriptView 
                       transcript={formattedTranscript} 
                       videoId={videoData.videoId}
                       onPlaySegment={playSegment}
                       activeSegmentIndex={activeSegmentIndex}
                    />
                </Card>
            </>
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
            <ListeningPracticePageContent />
        </WatchPageProvider>
    );
}

export default function ListeningPage() {
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

    