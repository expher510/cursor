"use client";

import { VideoPlayer } from "./video-player";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, BrainCircuit } from "lucide-react";
import { useWatchPage } from "@/context/watch-page-context";
import { Button } from "./ui/button";
import Link from "next/link";

function LoadingState() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="aspect-video w-full overflow-hidden rounded-lg border">
              <Skeleton className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      <div className="flex justify-center">
        <Skeleton className="h-12 w-48 rounded-md" />
      </div>
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
                    <p className="text-muted-foreground">
                        {message}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}


export function VideoWorkspace({ videoId }: { videoId: string }) {
  const { videoData, isLoading, error } = useWatchPage();
  
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!videoData) {
    // This can happen briefly or if there's no videoId, provider will set an error.
    return <LoadingState />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <VideoPlayer videoId={videoId} title={videoData.title} />
      <div className="flex justify-center">
        <Button asChild size="lg">
            <Link href={`/quiz?v=${videoId}`}>
                <BrainCircuit className="mr-2 h-5 w-5" />
                Start Quiz
            </Link>
        </Button>
      </div>
    </div>
  );
}
