'use client';
import { useState } from "react";
import { YoutubeUrlForm } from "@/components/youtube-url-form";
import { Logo } from "@/components/logo";
import { VideoHistory } from "@/components/video-history";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Edit, Headphones } from "lucide-react";
import { useRouter } from "next/navigation";
import { extractYouTubeVideoId } from "@/lib/utils";

function ActivityButtons({ videoId }: { videoId: string | null }) {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    if (videoId) {
      router.push(`/${path}?v=${videoId}`);
    }
  };

  return (
    <div className="w-full max-w-4xl pt-10 text-left">
       <h2 className="text-2xl font-bold font-headline mb-6 text-center">Choose Your Practice</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Button size="lg" disabled={!videoId} onClick={() => handleNavigation('watch')}>
            <Headphones className="mr-2" />
            Start Listening
        </Button>
        
        <Button size="lg" disabled={!videoId} onClick={() => handleNavigation('reading')}>
            <BookOpen className="mr-2" />
            Start Reading
        </Button>

        <Button size="lg" disabled={!videoId} onClick={() => handleNavigation('writing')}>
            <Edit className="mr-2" />
            Start Writing
        </Button>
      </div>
    </div>
  );
}


export default function Home() {
  const [url, setUrl] = useState('');
  const videoId = extractYouTubeVideoId(url);

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
          <ActivityButtons videoId={videoId} />
          <VideoHistory />
        </div>
      </main>
    </>
  );
}
