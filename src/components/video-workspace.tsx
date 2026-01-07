"use client";

import { useEffect } from "react";
import { VideoPlayer } from "./video-player";
import { useFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc, getDoc, getDocs, query, collection } from "firebase/firestore";
import { processVideo, ProcessVideoOutput, TranscriptItem } from "@/ai/flows/process-video-flow";
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
  const { setVideoData, videoData, isLoading, error, setError, setIsLoading } = useWatchPage();
  
  useEffect(() => {
    async function processAndSetVideo() {
      if (!videoId || !user || !firestore) {
        setError("User or video information is missing.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Try to fetch from Firestore first
        const videoDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}`);
        const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}/transcripts`, videoId);
        
        const videoDocSnap = await getDoc(videoDocRef);
        const transcriptDocSnap = await getDoc(transcriptDocRef);

        if (videoDocSnap.exists() && transcriptDocSnap.exists()) {
          console.log("Found video and transcript in Firestore. Loading from cache.");
          const videoInfo = videoDocSnap.data();
          const transcriptInfo = transcriptDocSnap.data();
          
          setVideoData({
              title: videoInfo.title,
              transcript: transcriptInfo.content,
          });
          setIsLoading(false);
          return;
        }

        // 2. If not in Firestore, call the API
        console.log("Video not in Firestore. Fetching from API.");
        const result = await processVideo({ videoId });
        const videoDataWithId = {
            ...result,
            transcript: result.transcript.map(t => ({...t, videoId: videoId}))
        };

        setVideoData(videoDataWithId);
        
        // 3. Save the new data to Firestore (non-blocking)
        setDocumentNonBlocking(videoDocRef, {
          id: videoId,
          title: result.title,
          userId: user.uid,
          timestamp: Date.now(),
        }, { merge: true });

        setDocumentNonBlocking(transcriptDocRef, {
            id: videoId,
            videoId: videoId,
            content: result.transcript,
        }, { merge: true });

      } catch (e: any) {
        console.error("Error processing video:", e);
        setError(e.message || "An unknown error occurred while processing the video.");
      } finally {
        setIsLoading(false);
      }
    }
    processAndSetVideo();
  }, [videoId, user, firestore, setVideoData, setError, setIsLoading]);
  
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
