"use client";

import { useEffect, useCallback } from "react";
import { MOCK_VIDEO_DATA } from "@/lib/data";
import { useHistory } from "@/hooks/use-history";
import { VideoPlayer } from "./video-player";
import { TranscriptView } from "./transcript-view";
import { useWatchPage } from "@/context/watch-page-context";

export function VideoWorkspace({ videoId }: { videoId: string }) {
  const { addHistoryItem } = useHistory();
  const { vocabulary, addVocabularyItem } = useWatchPage();

  const videoData = MOCK_VIDEO_DATA;

  useEffect(() => {
    addHistoryItem({ id: videoId, title: videoData.title });
  }, [videoId, videoData.title, addHistoryItem]);

  const handleAddToVocabulary = useCallback((word: string, translation: string) => {
    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    if (!vocabulary.some(item => item.word === cleanedWord)) {
      addVocabularyItem({ id: `${cleanedWord}-${Date.now()}`, word: cleanedWord, translation });
    }
  }, [vocabulary, addVocabularyItem]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-8">
      <div className="flex flex-col gap-6">
        <VideoPlayer videoId={videoId} title={videoData.title} />
        <TranscriptView 
          transcript={videoData.transcript} 
          translations={videoData.translations}
          onAddToVocabulary={handleAddToVocabulary}
        />
      </div>
    </div>
  );
}
