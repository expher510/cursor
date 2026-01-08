'use client';
import { useState } from "react";
import { YoutubeUrlForm } from "@/components/youtube-url-form";
import { VideoHistory } from "@/components/video-history";
import { Button } from "@/components/ui/button";
import { Headphones, BookOpen, Edit, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { extractYouTubeVideoId } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, limit, query, orderBy } from "firebase/firestore";
import { AppHeader } from "@/components/app-header";


type HistoryItem = {
  id: string;
  title: string;
  timestamp: number;
};

function ActivityButtons({ videoIdToUse, isHistoryLoading }: { videoIdToUse: string | null, isHistoryLoading: boolean }) {
  const router = useRouter();

  const isEnabled = !!videoIdToUse;

  const handleNavigation = (path: string) => {
    if (videoIdToUse) {
      router.push(`/${path}?v=${videoIdToUse}`);
    }
  };

  return (
    <div className="w-full max-w-4xl pt-10 text-left">
       <h2 className="text-2xl font-bold font-headline mb-6 text-center">Choose Your Practice</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Button size="lg" disabled={!isEnabled} onClick={() => handleNavigation('watch')}>
            {isHistoryLoading && <Loader2 className="mr-2 animate-spin" />}
            <Headphones className="mr-2" />
            Start Listening
        </Button>
        
        <Button size="lg" disabled={!isEnabled} onClick={() => handleNavigation('reading')}>
            {isHistoryLoading && <Loader2 className="mr-2 animate-spin" />}
            <BookOpen className="mr-2" />
            Start Reading
        </Button>

        <Button size="lg" disabled={!isEnabled} onClick={() => handleNavigation('quiz')}>
            {isHistoryLoading && <Loader2 className="mr-2 animate-spin" />}
            <Edit className="mr-2" />
            Start Quiz
        </Button>
      </div>
    </div>
  );
}

function MainContent({ url, onUrlChange }: { url: string; onUrlChange: (url: string) => void; }) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const { firestore, user } = useFirebase();

  const historyQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/videos`),
      orderBy("timestamp", "desc"),
      limit(20)
    );
  }, [user, firestore]);

  const { data: history, isLoading: isHistoryLoading } = useCollection<HistoryItem>(historyQuery);

  const newVideoId = extractYouTubeVideoId(url);
  const latestHistoryVideoId = history?.[0]?.id ?? null;
  const videoIdToUse = newVideoId || selectedVideoId || latestHistoryVideoId;

  return (
    <>
      <ActivityButtons videoIdToUse={videoIdToUse} isHistoryLoading={isHistoryLoading} />
      <VideoHistory 
        selectedVideoId={selectedVideoId}
        onVideoSelect={setSelectedVideoId}
      />
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
          
          <div className="flex flex-col gap-2 max-w-2xl">
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Unlock Languages with Video
            </h1>
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
            <MainContent url={url} onUrlChange={setUrl} />
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
