"use client";

import { VideoWorkspace } from "@/components/video-workspace";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { AppHeader } from "@/components/app-header";

function WatchPageContent() {
  return <VideoWorkspace />;
}

export default function WatchPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto flex-1 p-4 md:p-6 pt-24">
        <Suspense>
           <WatchPageContent />
        </Suspense>
      </main>
    </>
  );
}
