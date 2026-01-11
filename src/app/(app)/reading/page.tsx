
'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BrainCircuit, Loader2 } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState, useCallback, useMemo } from "react";
import ReactPlayer from "react-player";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUserProfile } from "@/hooks/use-user-profile";
import { generateQuizFromTranscript, type GenerateQuizOutput } from "@/ai/flows/generate-quiz-from-transcript-flow";
import { QuizView } from "@/components/quiz-player";


function QuickQuizGenerator() {
    const { videoData } = useWatchPage();
    const { userProfile } = useUserProfile();
    const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateQuiz = async () => {
        if (!videoData?.transcript || !userProfile) {
            return;
        }
        setIsLoading(true);
        setQuiz(null);

        try {
            const fullTranscript = videoData.transcript.map(t => t.text).join(' ');
            // Take a random snippet of the transcript
            const start = Math.floor(Math.random() * (fullTranscript.length - 1000));
            const snippet = fullTranscript.substring(start, start + 1000);

            const result = await generateQuizFromTranscript({
                transcript: snippet,
                targetLanguage: userProfile.targetLanguage,
                proficiencyLevel: userProfile.proficiencyLevel,
            });
            setQuiz(result);
        } catch (e) {
            console.error("Failed to generate quick quiz", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (quiz) {
        return (
            <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-4">
                 <QuizView questions={quiz.questions} onRetry={() => setQuiz(null)} />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <Button variant="outline" onClick={handleGenerateQuiz} size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <BrainCircuit className="mr-2" />}
                Generate Quick Quiz
            </Button>
            {isLoading && <p className="text-sm text-muted-foreground">AI is creating questions...</p>}
        </div>
    );
}


function ReadingPracticePageContent() {
    const { videoData, isLoading, error } = useWatchPage();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const playerRef = useRef<ReactPlayer>(null);
    
    const handlePlaySegment = useCallback((offset: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(offset / 1000, 'seconds');
            setIsPlaying(true);
        }
    }, []);

    const activeSegmentIndex = useMemo(() => {
        const transcript = videoData?.transcript;
        if (!transcript || transcript.length === 0) {
            return -1;
        }
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


    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            
             <div className="mb-4 text-center">
                <div className="flex justify-center">
                    <Logo />
                </div>
                <div className="mt-2 space-y-4">
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Read the text, save new words, and click any line to play its audio.
                    </p>
                    <QuickQuizGenerator />
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

            {/* Hidden Audio Player */}
            {videoData.audioUrl && (
                <div className="hidden">
                    <ReactPlayer
                        ref={playerRef}
                        url={videoData.audioUrl}
                        playing={isPlaying}
                        onProgress={(state) => {
                            setCurrentTime(state.playedSeconds * 1000);
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
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
        <main className="container mx-auto flex-1 p-4 md:p-6 pt-24 pb-32">
            <Suspense fallback={<div className="flex justify-center items-center h-full"><p>Loading...</p></div>}>
                <PageWithProvider />
            </Suspense>
        </main>
      </>
  );
}
