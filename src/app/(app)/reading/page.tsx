'use client';
import { AppHeader } from "@/components/app-header";
import { ReadingTabs } from "@/components/video-tabs";
import { useWatchPage } from "@/context/watch-page-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useFirebase } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { processVideo } from "@/ai/flows/process-video-flow";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";


function ReadingPracticePage() {
    const { videoData, isLoading, error } = useWatchPage();

    if (isLoading) {
        return (
             <div className="w-full max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
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
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold font-headline tracking-tight">Interactive Reading</h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
                    Click on any word in the transcript to instantly get its translation and add it to your personal vocabulary list.
                </p>
            </div>
            <ReadingTabs transcript={formattedTranscript} videoId={videoData.videoId!} />
        </div>
    )
}

function ReadingPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');
  const { firestore, user } = useFirebase();
  const { setVideoData, videoData, isLoading, setIsLoading, setError } = useWatchPage();

  useEffect(() => {
    if (!videoId) {
      setError("No video selected. Please go back and choose a video.");
      setIsLoading(false);
      return;
    }

    if (videoData && videoData.videoId === videoId) {
      if (isLoading) setIsLoading(false);
      return;
    }

    async function fetchVideoData() {
      if (!user || !firestore) {
        setError("User or database not available.");
        setIsLoading(false);
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
          processedData = {
              title: videoDocSnap.data().title,
              description: videoDocSnap.data().description,
              stats: videoDocSnap.data().stats,
              transcript: transcriptDocSnap.data().content,
          };
        } else {
            console.log("Video not in Firestore. Fetching from API and caching.");
            const result = await processVideo({ videoId });
            
            // Cache the new data to Firestore (non-blocking)
            setDocumentNonBlocking(videoDocRef, {
                id: videoId,
                title: result.title,
                description: result.description,
                stats: result.stats,
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
        console.error("Error processing video for reading:", e);
        setError(e.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVideoData();

  }, [videoId, user, firestore, setVideoData, setError, setIsLoading, videoData, isLoading]);

  return <ReadingPracticePage />;
}


export default function ReadingPage() {
  return (
      <>
        <AppHeader showBackButton={true} />
        <main className="container mx-auto flex-1 p-4 md:p-6 pt-24">
            <ReadingPageContent />
        </main>
      </>
  );
}
