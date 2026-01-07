'use client';
import { AppHeader } from "@/components/app-header";
import { ReadingTabs } from "@/components/video-tabs";
import { useWatchPage } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";


function ReadingPracticePage() {
    const { videoData, isLoading, error } = useWatchPage();

    if (isLoading) {
        return (
             <div className="w-full max-w-4xl mx-auto space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-full" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
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
        <div className="w-full max-w-4xl mx-auto">
             <div className="text-left mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight">{videoData.title}</h1>
                <p className="text-muted-foreground text-lg">
                    Read the transcript, interact with words, and manage your vocabulary.
                </p>
            </div>
            <ReadingTabs transcript={formattedTranscript} videoId={videoData.videoId!} />
        </div>
    )
}


export default function ReadingPage() {
  return (
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <ReadingPracticePage />
      </main>
  );
}
