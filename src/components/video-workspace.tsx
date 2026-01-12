
"use client";

import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, Edit, Eye, EyeOff, Loader2, Circle } from "lucide-react";
import { useWatchPage } from "@/context/watch-page-context";
import { Button } from "./ui/button";
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from "react";
import { CaptionView } from "./caption-view";
import { VocabularyList } from "./vocabulary-list";
import { Logo } from "./logo";
import { QuizPlayer } from "./quiz-player";
import type Player from 'react-player';

const DynamicReactPlayer = dynamic(() => import('react-player/youtube'), { ssr: false });


function LoadingState() {
  return (
     <div className="space-y-8 max-w-4xl mx-auto">
        <div className="space-y-2 text-center">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-full" />
        </div>
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-40 w-full" />
    </div>
  );
}

function ErrorState({ message, title = "Processing Error" }: { message: string, title?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center py-4">
      <Card className="max-w-lg text-center bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertTriangle />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground break-words">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function VideoWorkspace() {
  const { videoData, combinedQuizData, isLoading, error, handleQuizGeneration, isGeneratingQuiz, saveQuizResults } = useWatchPage();
  const [currentTime, setCurrentTime] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<Player>(null);
  const quizContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isQuizVisible && quizContainerRef.current) {
        quizContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isQuizVisible, quizContainerRef]);


  if (isLoading && !videoData) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!videoData || !videoData.videoId || !videoData.transcript) {
    return <ErrorState message="Video data could not be loaded." />;
  }

  const handleVideoEnd = () => {
    if (playerRef.current && duration > 0) {
      const seekToTime = duration > 1 ? duration - 1 : 0;
      playerRef.current.seekTo(seekToTime, 'seconds');
    }
  };
  
  const toggleQuizVisibility = () => {
      const newVisibility = !isQuizVisible;
      setIsQuizVisible(newVisibility);
      if (newVisibility) {
          handleQuizGeneration();
      }
  }


  return (
     <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
        <div className="w-full space-y-2 text-center mb-8">
            <div className="flex justify-center items-center gap-4">
              <Logo />
               {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            </div>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto">
                Listen to the video and follow along with the synchronized transcript. Click any word to save it. Click the dot <Circle className="inline-block h-5 w-5 border-2 rounded-full p-0.5 align-middle" /> next to a sentence to translate it.
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
                    <DynamicReactPlayer
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
                        onDuration={setDuration}
                        config={{
                            playerVars: {
                                modestbranding: 1,
                                rel: 0,
                                vq: 'tiny'
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
        
            <div ref={quizContainerRef} className="mt-4 w-full flex flex-col items-center gap-6 pt-4">
                <Button onClick={toggleQuizVisibility} size="lg" disabled={isGeneratingQuiz}>
                    {isGeneratingQuiz && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {!isGeneratingQuiz && <Edit className="mr-2 h-5 w-5" />}
                    {isQuizVisible
                        ? 'Close Quiz'
                        : 'Take a Quiz'
                    }
                </Button>
                 
                {isQuizVisible && (isGeneratingQuiz || isLoading) && !combinedQuizData && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="animate-spin" />
                        <p>Loading questions...</p>
                    </div>
                )}
                
                {isQuizVisible && !isGeneratingQuiz && !isLoading && !combinedQuizData && (
                    <p className="text-muted-foreground">No questions could be generated for this video.</p>
                )}
                
                {isQuizVisible && combinedQuizData && combinedQuizData.questions && combinedQuizData.questions.length > 0 && (
                    <div className="w-full">
                        <QuizPlayer quizData={combinedQuizData} onQuizComplete={saveQuizResults} />
                    </div>
                )}

            </div>
        </div>
    </div>
  );
}
