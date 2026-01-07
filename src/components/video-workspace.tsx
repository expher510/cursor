"use client";

import { useEffect, useCallback } from "react";
import { MOCK_VIDEO_DATA } from "@/lib/data";
import { VideoPlayer } from "./video-player";
import { TranscriptView } from "./transcript-view";
import { useWatchPage } from "@/context/watch-page-context";
import { useFirebase } from "@/firebase";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc } from "firebase/firestore";

export function VideoWorkspace({ videoId }: { videoId: string }) {
  const { firestore, user } = useFirebase();
  const { addVocabularyItemOptimistic } = useWatchPage();

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

  const handleAddToVocabulary = useCallback((word: string, translation: string) => {
    if (user && firestore) {
      addVocabularyItemOptimistic(word, translation, videoId);
    }
  }, [addVocabularyItemOptimistic, user, firestore, videoId]);


  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <div className="flex flex-col gap-6">
        <VideoPlayer videoId={videoId} title={videoData.title} />
        <TranscriptView 
          transcript={videoData.transcript} 
          translations={videoData.translations}
        />
      </div>
    </div>
  );
}
