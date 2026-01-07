"use client";

import { useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useMemoFirebase } from '@/firebase/provider';

type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
};

type WatchPageContextType = {
  vocabulary: VocabularyItem[];
  addVocabularyItem: (item: VocabularyItem) => void;
  removeVocabularyItem: (id: string) => void;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

export function WatchPageProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();
  
  // This local state is now primarily for optimistic updates.
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);

  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/vocabularies`));
  }, [user, firestore]);

  const { data: firestoreVocabulary, isLoading } = useCollection<VocabularyItem>(vocabQuery);

  useEffect(() => {
    if (firestoreVocabulary) {
      setVocabulary(firestoreVocabulary);
    }
  }, [firestoreVocabulary]);


  const addVocabularyItem = useCallback((item: VocabularyItem) => {
    setVocabulary(prev => {
      if (!prev.some(v => v.word === item.word)) {
        return [...prev, item];
      }
      return prev;
    });
  }, []);

  const removeVocabularyItem = useCallback((id: string) => {
    setVocabulary(prev => prev.filter(item => item.id !== id));
  }, []);

  const value = {
    vocabulary,
    addVocabularyItem,
    removeVocabularyItem,
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
