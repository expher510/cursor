'use client';

import { YoutubeUrlForm } from "@/components/youtube-url-form";
import { Logo } from "@/components/logo";
import { AppHeader } from "@/components/app-header";
import { VideoHistory } from "@/components/video-history";

export default function Home() {
  return (
    <>
      <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 pt-24">
        <div className="flex flex-col items-center gap-8 text-center max-w-4xl w-full">
          <Logo />
          <div className="flex flex-col gap-2">
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Unlock Languages with YouTube
            </h1>
            <p className="text-muted-foreground md:text-xl">
              Paste a YouTube URL to begin your interactive language learning journey. Turn any video into a lesson.
            </p>
          </div>
          <div className="w-full max-w-lg">
            <YoutubeUrlForm />
          </div>
          <VideoHistory />
        </div>
      </main>
    </>
  );
}
