"use client";

import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, Edit, Eye, EyeOff, Loader2 } from "lucide-react";
import { useWatchPage } from "@/context/watch-page-context";
import { Button } from "./ui/button";
import ReactPlayer from 'react-player/youtube';
import { useState, useRef } from "react";
import { CaptionView } from "./caption-view";
import { VocabularyList } from "./vocabulary-list";
import { Logo } from "./logo";
import { QuizPlayer } from "./quiz-player";


function LoadingState() {
  return (
     <div className="space-y-8 max-w-4xl mx-auto">
        <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-full" />
        </div>
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-40 w-full" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="max-w-lg text-center bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertTriangle />
            Processing Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function VideoWorkspace() {
  const { videoData, quizData, isLoading, error } = useWatchPage();
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!videoData || !videoData.videoId || !videoData.transcript) {
    return <ErrorState message="Video data could not be loaded." />;
  }

  const handleVideoEnd = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  };


  return (
     <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
        <div className="w-full space-y-2 text-center mb-8">
            <div className="flex justify-center">
              <Logo />
            </div>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto">
                Listen to the video and follow along with the synchronized transcript. Click any word to save it.
            </p>
        </div>

        <div className="w-full flex flex-col gap-4 items-center">
             <div className="w-full">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/75">
                     {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <Loader2 className="h-12 w-12 animate-spin text-white" />
                        </div>
                    )}
                    <ReactPlayer
                        ref={playerRef}
                        url={`https://www.youtube.com/watch?v=${videoData.videoId}`}
                        width="100%"
                        height="100%"
                        controls={true}
                        playing={true}
                        onProgress={(progress) => setCurrentTime(progress.playedSeconds * 1000)}
                        onBuffer={() => setIsBuffering(true)}
                        onBufferEnd={() => setIsBuffering(false)}
                        onEnded={handleVideoEnd}
                        config={{
                            youtube: {
                                playerVars: {
                                    modestbranding: 1,
                                    rel: 0,
                                    vq: 'tiny' // Attempt to request 144p quality
                                }
                            }
                        }}
                    />
                </div>
             </div>

            <div className="w-full relative">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowTranscript(!showTranscript)}
                >
                    {showTranscript ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    <span className="sr-only">{showTranscript ? "Hide transcript" : "Show transcript"}</span>
                </Button>
                
                {showTranscript && (
                    <CaptionView transcript={videoData.transcript} currentTime={currentTime} />
                )}
            </div>
            
            <div className="w-full">
                 <VocabularyList layout="scroll" />
            </div>
        
            <div className="mt-4 w-full flex flex-col items-center gap-6">
                <Button onClick={() => setIsQuizVisible(prev => !prev)} size="lg" disabled={!quizData}>
                    <Edit className="mr-2 h-5 w-5" />
                    {isQuizVisible ? 'Close Quiz' : (quizData ? 'Take a Quiz' : 'Quiz Coming Soon')}
                </Button>

                {isQuizVisible && quizData && quizData.id && (
                    <div className="w-full">
                        <QuizPlayer quizId={quizData.id} />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
