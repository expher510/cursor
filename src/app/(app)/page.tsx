
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
import { MOCK_QUIZ_QUESTIONS } from "@/lib/quiz-data";

type ActivityType = 'watch' | 'reading' | 'writing';

function ActivityButtons({ onActivitySelect, isProcessing, videoId }: { onActivitySelect: (activity: ActivityType) => void, isProcessing: boolean, videoId: string | null }) {
  const isEnabled = !!videoId;

  return (
    <div className="w-full max-w-4xl pt-10 text-left">
       <h2 className="text-2xl font-bold font-headline mb-6 text-center">Choose Your Practice</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => onActivitySelect('watch')}>
            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
            <Headphones className="mr-2" />
            Start Listening
        </Button>
        
        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => onActivitySelect('reading')}>
            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
            <BookOpen className="mr-2" />
            Start Reading
        </Button>

        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => onActivitySelect('writing')}>
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

function MainContent() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceType, setSourceType] = useState<'youtube' | 'books'>('youtube');

  const handleUrlChange = (newUrl: string) => {
    const videoId = extractYouTubeVideoId(newUrl);
    setActiveVideoId(videoId);
  };

  const handlePracticeNavigation = async (activity: ActivityType, videoId?: string) => {
    const videoIdToUse = videoId || activeVideoId;

    if (!user || !firestore || !videoIdToUse) {
        toast({ variant: "destructive", title: "No Video Selected", description: "Please enter a URL or select a video from your history." });
        return;
    };
    
    setIsProcessing(true);

    try {
        const result = await processVideo({ videoId: videoIdToUse });

        const videoDocRef = doc(firestore, `users/${user.uid}/videos`, videoIdToUse);
        const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${videoIdToUse}/transcripts`, videoIdToUse);
        const quizDocRef = doc(firestore, `users/${user.uid}/videos/${videoIdToUse}/quizzes`, 'comprehensive-test');

        await setDoc(videoDocRef, {
            id: videoIdToUse,
            title: result.title,
            description: result.description,
            stats: result.stats,
            userId: user.uid,
            timestamp: Date.now(),
        }, { merge: true });

        await setDoc(transcriptDocRef, {
            id: videoIdToUse,
            videoId: videoIdToUse,
            content: result.transcript,
        }, { merge: true });

        await setDoc(quizDocRef, {
          questions: MOCK_QUIZ_QUESTIONS,
        });

        router.push(`/${activity}?v=${videoIdToUse}`);

    } catch (e: any) {
        console.error("Failed to process and save video:", e);
        toast({ variant: "destructive", title: "Processing Failed", description: e.message || "Could not process the video. Please try another one." });
    } finally {
        setIsProcessing(false);
    }
  };


  return (
    <>
      <div className="w-full max-w-lg pt-4">
        <YoutubeUrlForm onUrlChange={handleUrlChange} />
      </div>

      <ActivityButtons videoId={activeVideoId} isProcessing={isProcessing} onActivitySelect={(activity) => handlePracticeNavigation(activity)} />
      
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
                activeVideoId={activeVideoId}
                onVideoSelect={setActiveVideoId}
                onVideoAction={(videoId, activity) => handlePracticeNavigation(activity, videoId)}
            />
        )}
      </div>
    </>
  );
}


export default function HomePage() {
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
          
          {isUserLoading ? (
            <Loader2 className="mt-12 h-8 w-8 animate-spin text-primary" />
          ) : user ? (
            <MainContent />
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
