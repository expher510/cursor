"use client";

import { useEffect } from "react";
import { VideoPlayer } from "./video-player";
import { useFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc, getDoc } from "firebase/firestore";
import { processVideo } from "@/ai/flows/process-video-flow";
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
  const { firestore, user } = useFirebase();
  const { setVideoData, videoData, isLoading, error, setError, setIsLoading } = useWatchPage();
  
  useEffect(() => {
    // If data for this videoId is already in context, don't refetch.
    if (videoData && videoData.videoId === videoId) {
        if (isLoading) setIsLoading(false);
        return;
    }

    async function processAndSetVideo() {
      if (!videoId || !user || !firestore) {
        setError("User or video information is missing.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const videoDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}`);
        const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}/transcripts`, videoId);
        
        const videoDocSnap = await getDoc(videoDocRef);
        const transcriptDocSnap = await getDoc(transcriptDocRef);

        let processedData;

        if (videoDocSnap.exists() && transcriptDocSnap.exists()) {
          console.log("Found video and transcript in Firestore. Loading from cache.");
          const videoInfo = videoDocSnap.data();
          const transcriptInfo = transcriptDocSnap.data();
          
          processedData = {
              title: videoInfo.title,
              transcript: transcriptInfo.content,
          };
        } else {
            console.log("Video not in Firestore. Fetching from API.");
            const result = await processVideo({ videoId });

            // Save the new data to Firestore (non-blocking)
            setDocumentNonBlocking(videoDocRef, {
            id: videoId,
            title: result.title || 'YouTube Video',
            userId: user.uid,
            timestamp: Date.now(),
            }, { merge: true });

            setDocumentNonBlocking(transcriptDocRef, {
                id: videoId,
                videoId: videoId,
                content: result.transcript,
            }, { merge: true });

            processedData = result;
        }

        setVideoData({
          ...processedData,
          videoId: videoId
        });

      } catch (e: any) {
        console.error("Error processing video:", e);
        setError(e.message || "An unknown error occurred while processing the video.");
      } finally {
        setIsLoading(false);
      }
    }
    processAndSetVideo();
  }, [videoId, user, firestore, setVideoData, setError, setIsLoading, videoData, isLoading]);
  
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!videoData) {
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
