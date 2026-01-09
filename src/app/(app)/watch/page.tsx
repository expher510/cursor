"use client";

import { VideoWorkspace } from "@/components/video-workspace";
import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { WatchPageProvider } from "@/context/watch-page-context";
import { Loader2 } from "lucide-react";

function WatchPageContent() {
  return (
    <WatchPageProvider>
      <VideoWorkspace />
    </WatchPageProvider>
  );
}

export default function WatchPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto flex-1 p-4 md:p-6 pt-24">
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
           <WatchPageContent />
        </Suspense>
      </main>
    </>
  );
}
