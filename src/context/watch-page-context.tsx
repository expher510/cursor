'use client';

import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, query, where } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect, useRef } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { type ProcessVideoOutput } from '@/ai/flows/process-video-flow';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { useSearchParams } from 'next/navigation';

type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
  videoId: string;
  userId: string;
};

type WatchPageContextType = {
  vocabulary: VocabularyItem[];
  savedWordsSet: Set<string>;
  addVocabularyItem: (word: string) => void;
  removeVocabularyItem: (id: string) => void;
  videoData: ProcessVideoOutput | null;
  setVideoData: (data: ProcessVideoOutput | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  notification: string | null;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

export function WatchPageProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v');

  const [videoData, setVideoData] = useState<ProcessVideoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((message: string) => {
    if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(message);
    notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
    }, 2000);
  }, []);


  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore || !videoId) return null;
    return query(
        collection(firestore, `users/${user.uid}/vocabularies`),
        where("videoId", "==", videoId)
    );
  }, [user, firestore, videoId]);

  const { data: vocabulary } = useCollection<VocabularyItem>(vocabQuery);

  const savedWordsSet = useMemo(() => {
    return new Set(vocabulary?.map(item => item.word) ?? []);
  }, [vocabulary]);


  const addVocabularyItem = useCallback(async (word: string) => {
    if (!user || !firestore || !videoId) return;

    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    if (!cleanedWord) return;

    if (savedWordsSet.has(cleanedWord)) {
        showNotification(`"${cleanedWord}" is already saved.`);
        return;
    }

    showNotification(`Saving "${cleanedWord}"...`);

    try {
        const { translation } = await translateWord({ word: cleanedWord, sourceLang: 'en', targetLang: 'ar' });

        const vocabCollectionRef = collection(firestore, `users/${user.uid}/vocabularies`);
        addDocumentNonBlocking(vocabCollectionRef, {
            word: cleanedWord,
            translation: translation || 'No translation found',
            userId: user.uid,
            videoId: videoId,
        });
        
        showNotification(`Saved!`);

    } catch (e: any) {
        console.error("Failed to translate or save word", e);
        showNotification(`Error saving word.`);
    }

  }, [user, firestore, videoId, savedWordsSet, showNotification]);

  const removeVocabularyItem = useCallback((id: string) => {
      if (!firestore || !user) return;
      const docRef = doc(firestore, `users/${user.uid}/vocabularies`, id);
      deleteDocumentNonBlocking(docRef);
  }, [firestore, user]);

  useEffect(() => {
      return () => {
          if(notificationTimeoutRef.current) {
              clearTimeout(notificationTimeoutRef.current);
          }
      }
  }, []);


  const value = {
    vocabulary: vocabulary ?? [],
    savedWordsSet,
    addVocabularyItem,
    removeVocabularyItem,
    videoData,
    setVideoData,
    isLoading,
    setIsLoading,
    error,
    setError,
    notification,
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
