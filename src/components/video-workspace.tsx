"use client";

import { useEffect } from "react";
import { MOCK_VIDEO_DATA } from "@/lib/data";
import { VideoPlayer } from "./video-player";
import { TranscriptView } from "./transcript-view";
import { useFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";

export function VideoWorkspace({ videoId }: { videoId: string }) {
  const { firestore, user } = useFirebase();

  const videoData = MOCK_VIDEO_DATA;

  useEffect(() => {
    if (user && firestore) {
      const videoDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}`);
      setDocumentNonBlocking(videoDocRef, {
        id: videoId,
        title: videoData.title,
        userId: user.uid,
        timestamp: Date.now(),
      }, { merge: true });
    }
  }, [videoId, videoData.title, user, firestore]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <div className="flex flex-col gap-6">
        <VideoPlayer videoId={videoId} title={videoData.title} />
        <TranscriptView 
          transcript={videoData.transcript} 
          translations={videoData.translations}
          videoId={videoId}
        />
      </div>
    </div>
  );
}
