'use client';

import { useFirebase } from '@/firebase';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, query, where } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useMemo, Dispatch, SetStateAction, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { type ProcessVideoOutput } from '@/ai/flows/process-video-flow';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const [videoData, setVideoData] = useState<ProcessVideoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentVideoId = videoData?.transcript?.[0] ? videoData.transcript[0].videoId : null;


  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore || !currentVideoId) return null;
    return query(
        collection(firestore, `users/${user.uid}/vocabularies`),
        where("videoId", "==", currentVideoId)
    );
  }, [user, firestore, currentVideoId]);

  const { data: vocabulary } = useCollection<VocabularyItem>(vocabQuery);

  const addVocabularyItem = useCallback(async (word: string, videoId: string) => {
    if (!user || !firestore) return;

    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    if (!cleanedWord) return;

    const alreadyExists = vocabulary?.some(item => item.word === cleanedWord);
    if (alreadyExists) {
        toast({
            title: "Already Saved",
            description: `"${cleanedWord}" is already in your vocabulary list.`,
        })
        return;
    }

    const { dismiss } = toast({
        title: "Translating & Saving...",
        description: `Adding "${cleanedWord}" to your list.`,
    });

    try {
        const { translation } = await translateWord({ word: cleanedWord, sourceLang: 'en', targetLang: 'ar' });

        const vocabCollectionRef = collection(firestore, `users/${user.uid}/vocabularies`);
        addDocumentNonBlocking(vocabCollectionRef, {
            word: cleanedWord,
            translation: translation || 'No translation found',
            userId: user.uid,
            videoId: videoId,
        });
        
        dismiss();
        toast({
            title: "Word Saved!",
            description: `"${cleanedWord}" has been translated and saved.`,
        });

    } catch (e) {
        console.error("Failed to translate or save word", e);
        dismiss();
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save the word. Please try again.",
        });
    }

  }, [user, firestore, vocabulary, toast]);

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
