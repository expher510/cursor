"use client";

import { VideoWorkspace } from "@/components/video-workspace";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { WatchPageProvider } from "@/context/watch-page-context";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');
  const shouldGenerate = searchParams.get('shouldGenerate');
  // Create a key that changes when the core params change, forcing a re-mount
  const key = `${videoId}-${shouldGenerate}`;

  return (
    <WatchPageProvider key={key}>
      <VideoWorkspace />
    </WatchPageProvider>
  );
}

export default function WatchPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto flex-1 p-4 md:p-6 pt-24">
        <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
           <WatchPageContent />
        </Suspense>
      </main>
    </>
  );
}
