"use client";

import { useEffect, useState } from "react";
import { VideoPlayer } from "./video-player";
import { useFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { processVideo, ProcessVideoOutput } from "@/ai/flows/process-video-flow";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle } from "lucide-react";
import { VideoTabs } from "./video-tabs";
import { useWatchPage } from "@/context/watch-page-context";

function LoadingState() {
  return (
    <div className="space-y-6">
        <Card>
          <CardContent className="p-4 md:p-6">
             <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="aspect-video w-full overflow-hidden rounded-lg border">
              <Skeleton className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      <Skeleton className="h-12 w-full rounded-md" />
      <Card>
        <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
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
  const { firestore, user } = useFirebase();
  const { setVideoData, videoData, isLoading, error } = useWatchPage();
  
  useEffect(() => {
    async function processAndSetVideo() {
      if (!videoId) {
        return;
      }
      
      setVideoData(null); // Clear previous data
      
      try {
        const result = await processVideo({ videoId });
        setVideoData(result);
        
        if (user && firestore) {
            // Save video metadata to history
            const videoDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}`);
            setDocumentNonBlocking(videoDocRef, {
              id: videoId,
              title: result.title,
              userId: user.uid,
              timestamp: Date.now(),
            }, { merge: true });

            // Save transcript
            const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}/transcripts`, videoId);
             setDocumentNonBlocking(transcriptDocRef, {
                id: videoId,
                videoId: videoId,
                content: result.transcript,
             }, { merge: true });
          }

      } catch (e: any) {
        console.error(e);
        // Let the context handle the error state
      }
    }
    processAndSetVideo();
  }, [videoId, user, firestore, setVideoData]);
  
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!videoData) {
    // This state can happen briefly between loading and data fetching, or if there's no data.
    return <LoadingState />;
  }
  
  const formattedTranscript = videoData.transcript.map(item => ({
    ...item,
    text: item.text,
  }));

  return (
    <div className="grid grid-cols-1 gap-6">
      <VideoPlayer videoId={videoId} title={videoData.title} />
      <VideoTabs 
        transcript={formattedTranscript} 
        videoId={videoId}
      />
    </div>
  );
}
