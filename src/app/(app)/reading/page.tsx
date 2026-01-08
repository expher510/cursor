'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Mic } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useState } from "react";


function ReadingPracticePage() {
    const { videoData, isLoading, error } = useWatchPage();
    const [isRecording, setIsRecording] = useState(false);
    const [showRecordingUI, setShowRecordingUI] = useState(false);


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

    if (error || !videoData) {
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
                    Practice your pronunciation by recording yourself reading the text below and get AI feedback.
                </p>
                <div className="mt-6 flex justify-center">
                    <Button onClick={() => setShowRecordingUI(prev => !prev)} size="lg" className="rounded-full">
                        <Mic className="mr-2 h-5 w-5" />
                        {showRecordingUI ? 'Cancel Test' : 'Start Speaking Test'}
                    </Button>
                </div>
            </div>

            {showRecordingUI ? (
                <Card className="p-6 flex flex-col items-center gap-4">
                    <h3 className="text-lg font-semibold">Recording...</h3>
                    <Button
                        onClick={() => setIsRecording(prev => !prev)}
                        size="lg"
                        variant={isRecording ? 'destructive' : 'default'}
                    >
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                    <p className="text-sm text-muted-foreground">Click "Start Recording" and read the text aloud.</p>
                </Card>
            ) : (
                <>
                    <VocabularyList layout="scroll" />
                    <Card>
                        <TranscriptView transcript={formattedTranscript} videoId={videoData.videoId} />
                    </Card>
                </>
            )}

        </div>
    )
}

export default function ReadingPage() {
  return (
      <>
        <AppHeader showBackButton={true} />
        <main className="container mx-auto flex-1 p-4 md:p-6 pt-24">
            <ReadingPracticePage />
        </main>
      </>
  );
}
