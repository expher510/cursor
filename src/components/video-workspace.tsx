"use client";

import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, BrainCircuit, Copy } from "lucide-react";
import { useWatchPage } from "@/context/watch-page-context";
import { Button } from "./ui/button";
import Link from "next/link";
import ReactPlayer from 'react-player/youtube';
import { useState } from "react";
import { CaptionView } from "./caption-view";
import { VocabularyList } from "./vocabulary-list";


function LoadingState() {
  return (
     <div className="space-y-8 max-w-4xl mx-auto">
        <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-full" />
        </div>
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex">
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
          <p className="text-muted-foreground">{message}</p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function VideoWorkspace() {
  const { videoData, isLoading, error } = useWatchPage();
  const [currentTime, setCurrentTime] = useState(0);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!videoData || !videoData.videoId || !videoData.transcript) {
    return <ErrorState message="Video data could not be loaded." />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Interactive Listening</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Listen to the video and follow along with the synchronized transcript. Click any word to save it.
            </p>
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/75 p-1">
            <ReactPlayer
                url={`https://www.youtube.com/watch?v=${videoData.videoId}`}
                width="100%"
                height="100%"
                controls={true}
                playing={true}
                onProgress={(progress) => setCurrentTime(progress.playedSeconds * 1000)}
                config={{
                    youtube: {
                        playerVars: {
                            modestbranding: 1,
                            rel: 0,
                        }
                    }
                }}
            />
        </div>
  
        <CaptionView transcript={videoData.transcript} currentTime={currentTime} />

        <div className="flex justify-center">
            <Button asChild size="lg">
            <Link href={`/quiz?v=${videoData.videoId}`}>
                <BrainCircuit className="mr-2 h-5 w-5" />
                Test Your Comprehension
            </Link>
            </Button>
        </div>
    </div>
  );
}
