"use client";

import { useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useMemoFirebase } from '@/firebase/provider';
import { DragEndEvent } from '@dnd-kit/core';

type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
  videoId: string;
  userId: string;
};

type ActiveDragData = {
  word: string;
  translation: string;
} | null;


type WatchPageContextType = {
  vocabulary: VocabularyItem[];
  addVocabularyItemOptimistic: (word: string, translation: string, videoId: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeDragData: ActiveDragData;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

export function WatchPageProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();
  
  const [localVocabulary, setLocalVocabulary] = useState<VocabularyItem[]>([]);
  const [activeDragData, setActiveDragData] = useState<ActiveDragData>(null);

  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/vocabularies`));
  }, [user, firestore]);

  const { data: firestoreVocabulary, isLoading } = useCollection<VocabularyItem>(vocabQuery);

  const vocabulary = useMemoFirebase(() => {
    return firestoreVocabulary ?? localVocabulary;
  }, [firestoreVocabulary, localVocabulary]);


  const addVocabularyItemOptimistic = useCallback((word: string, translation: string, videoId: string) => {
    if (!user || !firestore) return;

    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");

    const alreadyExists = (firestoreVocabulary ?? []).some(item => item.word === cleanedWord);
    if (alreadyExists) return;

    // Optimistic update
    const optimisticItem: VocabularyItem = {
      id: `temp-${Date.now()}`,
      word: cleanedWord,
      translation,
      videoId,
      userId: user.uid,
    };
    setLocalVocabulary(prev => [...prev, optimisticItem]);

    // Firestore update
    const vocabCollectionRef = collection(firestore, `users/${user.uid}/vocabularies`);
    const newVocabItem = {
      word: cleanedWord,
      translation,
      userId: user.uid,
      videoId: videoId,
    };
    addDocumentNonBlocking(vocabCollectionRef, newVocabItem);
  }, [user, firestore, firestoreVocabulary]);


  const onDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;

    if (over && over.id === 'vocabulary-drop-area' && active.data.current) {
      const { word, translation, videoId } = active.data.current;
      addVocabularyItemOptimistic(word, translation, videoId);
    }
  }, [addVocabularyItemOptimistic]);

  useEffect(() => {
    // This effect ensures that optimistic updates are cleared
    // once Firestore data is loaded or re-fetched.
    if(firestoreVocabulary) {
      setLocalVocabulary([]);
    }
  }, [firestoreVocabulary]);

  const value = {
    vocabulary: vocabulary ?? [],
    addVocabularyItemOptimistic,
    onDragEnd,
    activeDragData
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
