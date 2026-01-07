"use client";

import { VideoWorkspace } from "@/components/video-workspace";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

function WatchPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');

  if (!videoId) {
    return (
      <div className="container mx-auto mt-10">
        <Card className="max-w-md mx-auto text-center border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
                <AlertTriangle />
                Invalid Video URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The video URL is missing or invalid. Please go back to the homepage and try again.</p>
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
