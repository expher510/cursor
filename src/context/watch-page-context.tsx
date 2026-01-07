"use client";

import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useMemo, Dispatch, SetStateAction, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { type ProcessVideoOutput } from '@/ai/flows/process-video-flow';

type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
  videoId: string;
  userId: string;
};

type WatchPageContextType = {
  vocabulary: VocabularyItem[];
  addVocabularyItem: (word: string, videoId: string) => void;
  removeVocabularyItem: (id: string) => void;
  videoData: ProcessVideoOutput | null;
  setVideoData: (data: ProcessVideoOutput | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

export function WatchPageProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();

  const [videoData, setVideoData] = useState<ProcessVideoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/vocabularies`);
  }, [user, firestore]);

  const { data: vocabulary, isLoading: isVocabLoading } = useCollection<VocabularyItem>(vocabQuery);

  const addVocabularyItem = useCallback((word: string, videoId: string) => {
    if (!user || !firestore) return;

    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    if (!cleanedWord) return;

    const alreadyExists = vocabulary?.some(item => item.word === cleanedWord);
    if (alreadyExists) return;

    const translation = ""; // No translation for now

    const vocabCollectionRef = collection(firestore, `users/${user.uid}/vocabularies`);
    addDocumentNonBlocking(vocabCollectionRef, {
      word: cleanedWord,
      translation: translation,
      userId: user.uid,
      videoId: videoId,
    });
  }, [user, firestore, vocabulary]);

  const removeVocabularyItem = useCallback((id: string) => {
      if (!firestore || !user) return;
      const docRef = doc(firestore, `users/${user.uid}/vocabularies`, id);
      deleteDocumentNonBlocking(docRef);
  }, [firestore, user]);


  const value = {
    vocabulary: vocabulary ?? [],
    addVocabularyItem,
    removeVocabularyItem,
    videoData,
    setVideoData,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return (
    <WatchPageContext.Provider value={value}>
      {children}
    </WatchPageContext.Provider>
  );
}

export function useWatchPage() {
  const context = useContext(WatchPageContext);
  if (context === undefined) {
    throw new Error('useWatchPage must be used within a WatchPageProvider');
  }
  return context;
}
