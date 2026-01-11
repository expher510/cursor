'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Edit, Loader2, Circle, Play, Pause, Headphones } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { QuizPlayer } from "@/components/quiz-player";
import ReactPlayer from 'react-player/youtube';
import { cn } from "@/lib/utils";


function ReadingQuiz() {
    const { 
        videoData,
        quizData, 
        hardcodedQuizData, 
        isLoading, 
        handleQuizGeneration, 
        isGeneratingQuiz, 
        saveQuizResults 
    } = useWatchPage();
    const [isQuizVisible, setIsQuizVisible] = useState(false);
    const quizContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isQuizVisible && quizContainerRef.current) {
            quizContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isQuizVisible]);


    const combinedQuizData = useMemo(() => {
        if (!isQuizVisible) return null;

        const allQuestions = [
            ...(hardcodedQuizData?.questions || []),
            ...(quizData?.questions || [])
        ];

        if (allQuestions.length === 0) return null;

        return {
            id: quizData?.id || hardcodedQuizData?.id || `combined-quiz-${Date.now()}`,
            videoId: videoData?.videoId,
            questions: allQuestions,
        };
    }, [quizData, hardcodedQuizData, isQuizVisible, videoData]);

    const toggleQuizVisibility = () => {
        const newVisibility = !isQuizVisible;
        setIsQuizVisible(newVisibility);
        if (newVisibility && !quizData) {
            handleQuizGeneration();
        }
    }
    
    if (!videoData?.transcript) {
        return null; // Don't show the button if there's no transcript
    }

    return (
        <div ref={quizContainerRef} className="mt-4 w-full flex flex-col items-center gap-6 pt-4">
            <Button onClick={toggleQuizVisibility} size="lg" disabled={isGeneratingQuiz}>
                {isGeneratingQuiz && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {!isGeneratingQuiz && <Edit className="mr-2 h-5 w-5" />}
                {isQuizVisible ? 'Close Quiz' : 'Take a Quiz'}
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
    );
}


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const playerRef = useRef<ReactPlayer>(null);

    const handlePlayPause = () => {
        if (!hasStarted) {
            setHasStarted(true);
        }
        setIsPlaying(prev => !prev);
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
    
    const handleProgress = (progress: { playedSeconds: number }) => {
        if (!hasStarted) return;
        const currentTime = progress.playedSeconds * 1000;
        const activeIndex = formattedTranscript.findIndex(
            (item, index) =>
                currentTime >= item.offset &&
                (index === formattedTranscript.length - 1 || currentTime < formattedTranscript[index + 1].offset)
        );
        setActiveSegmentIndex(activeIndex);
    };
    
    const handleLineClick = (offset: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(offset / 1000, 'seconds');
            if (!isPlaying) {
                setIsPlaying(true);
                setHasStarted(true);
            }
        }
    }

    return (
        <>
        <div className="w-full max-w-4xl mx-auto space-y-6 relative">
             <div className="mb-4 text-center">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <div className="mt-2 space-y-4">
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Read the text and save new words to your vocabulary list. Click the dot <Circle className="inline-block h-5 w-5 border-2 rounded-full p-0.5 align-middle" /> next to a sentence to translate it.
                    </p>
                </div>
            </div>
            
            <>
                <VocabularyList layout="scroll" />
                <Card>
                   {!hasStarted ? (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                            <Button size="lg" onClick={handlePlayPause}>
                                <Headphones className="mr-2" />
                                Start Listening
                            </Button>
                        </div>
                    ) : (
                        <div className="fixed right-4 md:right-8 bottom-8 z-50">
                            <Button onClick={handlePlayPause} size="lg" className="h-16 w-16 rounded-full shadow-lg">
                                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                            </Button>
                        </div>
                    )}
                    <TranscriptView 
                       transcript={formattedTranscript} 
                       videoId={videoData.videoId}
                       activeSegmentIndex={activeSegmentIndex}
                       onPlaySegment={(offset) => handleLineClick(offset)}
                    />
                </Card>
                 <ReadingQuiz />
            </>
        </div>
        
         <div className="absolute top-[-1000px] left-[-1000px]">
            <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${videoData.videoId}`}
                playing={isPlaying && hasStarted}
                onProgress={handleProgress}
                onEnded={() => setIsPlaying(false)}
                volume={1}
                muted={false}
                width="1px"
                height="1px"
                config={{
                    youtube: {
                        playerVars: {
                            controls: 0,
                            disablekb: 1,
                            fs: 0,
                            iv_load_policy: 3,
                            modestbranding: 1,
                            playsinline: 1,
                        }
                    }
                }}
            />
        </div>
        </>
    )
}

function PageWithProvider() {
    const searchParams = useSearchParams();
    const videoId = searchParams.get('v');
    const shouldGenerate = searchParams.get('shouldGenerate');
    const key = `${videoId}-${shouldGenerate}`;

    return (
        <WatchPageProvider key={key}>
            {() => (
                <ReadingPracticePageContent />
            )}
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