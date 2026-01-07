"use client";

import { useState, useEffect, useCallback } from "react";
import { MOCK_VIDEO_DATA } from "@/lib/data";
import { useHistory } from "@/hooks/use-history";
import { VideoPlayer } from "./video-player";
import { TranscriptView } from "./transcript-view";
import { VocabularyList } from "./vocabulary-list";

type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
};

export function VideoWorkspace({ videoId }: { videoId: string }) {
  const { addHistoryItem } = useHistory();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);

  // In a real app, you would fetch data based on videoId.
  // Here, we use mock data for any valid ID.
  const videoData = MOCK_VIDEO_DATA;

  useEffect(() => {
    addHistoryItem({ id: videoId, title: videoData.title });
  }, [videoId, videoData.title, addHistoryItem]);

  const handleAddToVocabulary = useCallback((word: string, translation: string) => {
    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    if (!vocabulary.some(item => item.word === cleanedWord)) {
      setVocabulary(prev => [...prev, { id: `${cleanedWord}-${Date.now()}`, word: cleanedWord, translation }]);
    }
  }, [vocabulary]);

  const handleRemoveFromVocabulary = useCallback((id: string) => {
    setVocabulary(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <VideoPlayer videoId={videoId} title={videoData.title} />
        <TranscriptView 
          transcript={videoData.transcript} 
          translations={videoData.translations}
          onAddToVocabulary={handleAddToVocabulary}
        />
      </div>
      <div className="lg:col-span-1">
        <VocabularyList 
          vocabulary={vocabulary} 
          onRemove={handleRemoveFromVocabulary} 
        />
      </div>
    </div>
  );
}
