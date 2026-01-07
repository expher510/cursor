'use client';
import { useState } from "react";
import { YoutubeUrlForm } from "@/components/youtube-url-form";
import { Logo } from "@/components/logo";
import { VideoHistory } from "@/components/video-history";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Edit, Headphones, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { extractYouTubeVideoId } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemoFirebase } from "@/firebase/provider";
import { collection, limit, query, orderBy } from "firebase/firestore";

type HistoryItem = {
  id: string;
  title: string;
  timestamp: number;
};

function ActivityButtons({ newVideoId, latestHistoryVideoId, isHistoryLoading }: { newVideoId: string | null, latestHistoryVideoId: string | null, isHistoryLoading: boolean }) {
  const router = useRouter();

  // A button is active if there's a new video OR if there's history.
  const videoIdToUse = newVideoId || latestHistoryVideoId;
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

        <Button size="lg" disabled={!isEnabled} onClick={() => handleNavigation('writing')}>
            {isHistoryLoading && <Loader2 className="mr-2 animate-spin" />}
            <Edit className="mr-2" />
            Start Writing
        </Button>
      </div>
    </div>
  );
}


export default function Home() {
  const [url, setUrl] = useState('');
  const { firestore, user } = useFirebase();

  // Fetch the latest video from history to enable the buttons
  const historyQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/videos`),
      orderBy("timestamp", "desc"),
      limit(1)
    );
  }, [user, firestore]);

  const { data: history, isLoading: isHistoryLoading } = useCollection<HistoryItem>(historyQuery);

  const newVideoId = extractYouTubeVideoId(url);
  const latestHistoryVideoId = history?.[0]?.id ?? null;

  return (
    <>
      <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 pt-24">
        <div className="flex flex-col items-center gap-8 text-center max-w-5xl w-full">
          <Logo />
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
          <ActivityButtons newVideoId={newVideoId} latestHistoryVideoId={latestHistoryVideoId} isHistoryLoading={isHistoryLoading} />
          <VideoHistory />
        </div>
      </main>
    </>
  );
}
