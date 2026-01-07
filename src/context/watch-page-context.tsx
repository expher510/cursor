"use client";

import { useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
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
  setActiveDragData: Dispatch<SetStateAction<ActiveDragData>>;
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

  const { data: firestoreVocabulary } = useCollection<VocabularyItem>(vocabQuery);

  const vocabulary = useMemo(() => {
    // Combine firestore data with local optimistic updates
    if (!firestoreVocabulary) return localVocabulary;

    const firestoreWords = new Set(firestoreVocabulary.map(item => item.word));
    const uniqueLocalItems = localVocabulary.filter(item => !firestoreWords.has(item.word));

    return [...firestoreVocabulary, ...uniqueLocalItems];
  }, [firestoreVocabulary, localVocabulary]);


  const addVocabularyItemOptimistic = useCallback((word: string, translation: string, videoId: string) => {
    if (!user || !firestore) return;

    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");

    const alreadyExists = vocabulary.some(item => item.word === cleanedWord);
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
  }, [user, firestore, vocabulary]);


  const onDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;

    if (over && over.id === 'vocabulary-drop-area' && active.data.current) {
      const { word, translation, videoId } = active.data.current;
      addVocabularyItemOptimistic(word, translation, videoId);
    }
  }, [addVocabularyItemOptimistic]);

  useEffect(() => {
    // This effect helps clear temporary optimistic items if they are successfully
    // added to firestore, preventing potential duplicates on fast re-renders.
    if(firestoreVocabulary) {
       const firestoreWords = new Set(firestoreVocabulary.map(item => item.word));
       setLocalVocabulary(prev => prev.filter(item => !firestoreWords.has(item.word)));
    }
  }, [firestoreVocabulary]);

  const value = {
    vocabulary: vocabulary ?? [],
    addVocabularyItemOptimistic,
    onDragEnd,
    activeDragData,
    setActiveDragData,
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
