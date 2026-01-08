
'use client';
import { useState } from "react";
import { YoutubeUrlForm } from "@/components/youtube-url-form";
import { VideoHistory } from "@/components/video-history";
import { Button } from "@/components/ui/button";
import { Headphones, BookOpen, Edit, Loader2, Youtube, Book, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { extractYouTubeVideoId } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { AppHeader } from "@/components/app-header";
import { processVideo } from "@/ai/flows/process-video-flow";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";


function ActivityButtons({ videoIdToUse, isProcessing, onActivitySelect }: { videoIdToUse: string | null, isProcessing: boolean, onActivitySelect: (path: string, videoId: string) => void }) {
  const isEnabled = !!videoIdToUse;

  const handleNavigation = (path: string) => {
    if (videoIdToUse) {
      onActivitySelect(path, videoIdToUse);
    }
  };

  return (
    <div className="w-full max-w-4xl pt-10 text-left">
       <h2 className="text-2xl font-bold font-headline mb-6 text-center">Choose Your Practice</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => handleNavigation('watch')}>
            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
            <Headphones className="mr-2" />
            Start Listening
        </Button>
        
        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => handleNavigation('reading')}>
            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
            <BookOpen className="mr-2" />
            Start Reading
        </Button>

        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => handleNavigation('quiz')}>
            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
            <Edit className="mr-2" />
            Start Writing
        </Button>

        <Button size="lg" asChild>
            <Link href="/flashcards">
                <Copy className="mr-2" />
                My Cards
            </Link>
        </Button>
      </div>
    </div>
  );
}

function MainContent({ url }: { url: string; }) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceType, setSourceType] = useState<'youtube' | 'books'>('youtube');


  const newVideoId = extractYouTubeVideoId(url);
  const videoIdToUse = newVideoId || selectedVideoId;

  const handlePracticeNavigation = async (path: string, videoId: string) => {
    if (!user || !firestore) return;
    
    setIsProcessing(true);

    try {
        const result = await processVideo({ videoId });

        const videoDocRef = doc(firestore, `users/${user.uid}/videos`, videoId);
        const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}/transcripts`, videoId);

        await setDoc(videoDocRef, {
            id: videoId,
            title: result.title,
            description: result.description,
            stats: result.stats,
            userId: user.uid,
            timestamp: Date.now(),
        }, { merge: true });

        await setDoc(transcriptDocRef, {
            id: videoId,
            videoId: videoId,
            content: result.transcript,
        }, { merge: true });

        router.push(`/${path}?v=${videoId}`);

    } catch (e: any) {
        console.error("Failed to process and save video:", e);
        toast({ variant: "destructive", title: "Processing Failed", description: e.message || "Could not process the video. Please try another one." });
    } finally {
        setIsProcessing(false);
    }
  };


  return (
    <>
      <ActivityButtons videoIdToUse={videoIdToUse} isProcessing={isProcessing} onActivitySelect={handlePracticeNavigation} />
      
      <div className="w-full max-w-4xl pt-10">
        <div className="flex justify-center items-center gap-4 mb-6">
            <Button
                variant={sourceType === 'youtube' ? 'secondary' : 'ghost'}
                onClick={() => setSourceType('youtube')}
                className={cn("gap-2", sourceType === 'youtube' && "text-primary")}
            >
                <Youtube />
                YouTube
            </Button>
             <Button
                variant={sourceType === 'books' ? 'secondary' : 'ghost'}
                onClick={() => setSourceType('books')}
                className={cn("gap-2", sourceType === 'books' && "text-primary")}
            >
                <Book />
                Books
            </Button>
        </div>
        
        {sourceType === 'youtube' && (
            <VideoHistory 
                selectedVideoId={selectedVideoId}
                onVideoSelect={setSelectedVideoId}
            />
        )}
      </div>
    </>
  );
}


export default function HomePage() {
  const [url, setUrl] = useState('');
  const { user, isUserLoading } = useFirebase();

  return (
    <>
      <AppHeader />
      <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 pt-24">
        <div className="flex flex-col items-center gap-8 text-center max-w-5xl w-full">
          
          <div className="flex flex-col items-center gap-2 max-w-2xl">
              <Logo />
            <p className="text-muted-foreground md:text-xl">
              Paste a YouTube link below to turn any video into an interactive language lesson.
            </p>
          </div>
          <div className="w-full max-w-lg pt-4">
            <YoutubeUrlForm onUrlChange={setUrl} />
          </div>
          
          {isUserLoading ? (
            <Loader2 className="mt-12 h-8 w-8 animate-spin text-primary" />
          ) : user ? (
            <MainContent url={url} />
          ) : (
             <div className="text-center p-8 border-dashed border-2 rounded-lg mt-8">
                <p className="text-muted-foreground">Please log in or sign up to see your history and start practicing.</p>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
