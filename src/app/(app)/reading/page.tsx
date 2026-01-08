'use client';
import { AppHeader } from "@/components/app-header";
import { useWatchPage } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Edit } from "lucide-react";
import { VocabularyList } from "@/components/vocabulary-list";
import { TranscriptView } from "@/components/transcript-view";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import Link from 'next/link';


function ReadingPracticePage() {
    const { videoData, isLoading, error } = useWatchPage();

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
                    Read the full transcript below, save new words, and then test your knowledge with a quiz.
                </p>
                <div className="mt-6 flex justify-center">
                    <Button asChild size="lg" className="rounded-full">
                        <Link href={`/quiz?v=${videoData.videoId}`}>
                            <Edit className="mr-2 h-5 w-5" />
                            Reading Quiz
                        </Link>
                    </Button>
                </div>
            </div>

            <VocabularyList layout="scroll" />
            <Card>
                <TranscriptView transcript={formattedTranscript} videoId={videoData.videoId} />
            </Card>

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
