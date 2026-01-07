"use client";

import { useEffect, useState } from "react";
import { VideoPlayer } from "./video-player";
import { TranscriptView } from "./transcript-view";
import { useFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { processVideo, ProcessVideoOutput } from "@/ai/flows/process-video-flow";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { AlertTriangle } from "lucide-react";

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
             <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="aspect-video w-full overflow-hidden rounded-lg border">
              <Skeleton className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
             <Skeleton className="h-8 w-1/4" />
             <Skeleton className="h-6 w-full" />
             <Skeleton className="h-6 w-5/6" />
             <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div className="flex h-full items-center justify-center">
            <Card className="max-w-lg text-center bg-destructive/10 border-destructive">
                <CardContent className="p-6">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <h2 className="mt-4 font-headline text-2xl font-semibold text-destructive">
                        An Error Occurred
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        {message}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}


export function VideoWorkspace({ videoId }: { videoId: string }) {
  const { firestore, user } = useFirebase();
  const [videoData, setVideoData] = useState<ProcessVideoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processAndSetVideo() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await processVideo({ videoId });
        setVideoData(result);
        
        if (user && firestore) {
            const videoDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}`);
            setDocumentNonBlocking(videoDocRef, {
              id: videoId,
              title: result.title,
              userId: user.uid,
              timestamp: Date.now(),
            }, { merge: true });
          }

      } catch (e: any) {
        console.error(e);
        // Display the specific error message from the flow
        setError(e.message || "Could not process the video. The transcript might not be available.");
      } finally {
        setIsLoading(false);
      }
    }
    processAndSetVideo();
  }, [videoId, user, firestore]);
  
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!videoData) {
    return null; // Or some other placeholder
  }
  
  const formattedTranscript = videoData.transcript.map(item => ({
    ...item,
    timestamp: new Date(item.offset).toISOString().substr(14, 5) // Format to MM:SS
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <div className="flex flex-col gap-6">
        <VideoPlayer videoId={videoId} title={videoData.title} />
        <TranscriptView 
          transcript={formattedTranscript} 
          translations={videoData.translations}
          videoId={videoId}
        />
      </div>
    </div>
  );
}
