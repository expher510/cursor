
'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Edit, Loader2, Circle, Play, Pause, Move } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useMemo, Suspense, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { QuizPlayer } from "@/components/quiz-player";
import { cn } from "@/lib/utils";
import { CircularProgressControl } from "@/components/circular-progress-control";
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';


function ReadingQuiz() {
    const { 
        combinedQuizData,
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


    const toggleQuizVisibility = () => {
        const newVisibility = !isQuizVisible;
        setIsQuizVisible(newVisibility);
        if (newVisibility) {
            handleQuizGeneration();
        }
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
   
    if (isLoading && !videoData) {
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
                    <TranscriptView 
                       transcript={formattedTranscript} 
                       videoId={videoData.videoId}
                       activeSegmentIndex={-1}
                       onPlaySegment={null}
                    />
                </Card>
                 <ReadingQuiz />
            </>
        </div>
        </>
    )
}

function DraggableVideoPlayer() {
    const { videoData } = useWatchPage();
    const dragRef = useRef<HTMLDivElement>(null);
    
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });


    const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragStartPos.current = {
            x: clientX - position.x,
            y: clientY - position.y
        };
        if (dragRef.current) {
            dragRef.current.style.cursor = 'grabbing';
        }
    };

    const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        if ('touches' in e) {
            e.preventDefault();
        }
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        setPosition({
            x: clientX - dragStartPos.current.x,
            y: clientY - dragStartPos.current.y
        });
    }, [isDragging]);

    const onDragEnd = () => {
        setIsDragging(false);
         if (dragRef.current) {
            dragRef.current.style.cursor = 'grab';
        }
    };
    
     useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('mouseup', onDragEnd);
            window.addEventListener('touchmove', onDragMove, { passive: false });
            window.addEventListener('touchend', onDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            window.removeEventListener('touchmove', onDragMove);
            window.removeEventListener('touchend', onDragEnd);
        };
    }, [isDragging, onDragMove]);


    if (!videoData || !videoData.videoId) return null;

    return (
        <div
            ref={dragRef}
            className="fixed bottom-8 right-4 z-50 h-36 w-64 cursor-grab"
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
        >
            <div className="absolute inset-0">
                <div className="relative h-full w-full rounded-lg overflow-hidden shadow-lg flex-shrink-0 border-2 border-primary">
                    <LiteYouTubeEmbed
                        id={videoData.videoId}
                        title={videoData.title}
                        params="modestbranding=1&rel=0&autoplay=1"
                        noCookie={true}
                    />
                </div>
            </div>
             <div className="absolute top-0 right-0 p-1 bg-muted/50 rounded-full pointer-events-none">
                <Move className="h-4 w-4 text-white/50" />
            </div>
        </div>
    );
}


function PageWithProvider() {
    return (
        <WatchPageProvider>
            <PageContent />
        </WatchPageProvider>
    );
}

function PageContent() {
    const { isLoading, videoData } = useWatchPage();
    return (
        <>
            <ReadingPracticePageContent />
            {!isLoading && videoData && (
                <DraggableVideoPlayer />
            )}
        </>
    )
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
