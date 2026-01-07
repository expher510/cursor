"use client";

import { VideoWorkspace } from "@/components/video-workspace";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');

  if (!videoId) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="p-6">
            <h2 className="font-headline text-2xl font-semibold text-destructive">Invalid Video</h2>
            <p className="mt-2 text-muted-foreground">The video URL is missing or invalid. Please go back to the homepage and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <VideoWorkspace videoId={videoId} />;
}

export default function WatchPage() {
  return (
    <Suspense>
      <WatchPageContent />
    </Suspense>
  );
}
