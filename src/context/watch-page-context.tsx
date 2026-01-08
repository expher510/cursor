'use client';

import { useFirebase } from '@/firebase';
import { collection, doc, query, addDoc, deleteDoc, getDoc, setDoc, orderBy, limit, getDocs } from 'firebase/firestore';
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

type VideoData = ProcessVideoOutput & { videoId?: string };


type WatchPageContextType = {
  vocabulary: VocabularyItem[];
  savedWordsSet: Set<string>;
  addVocabularyItem: (word: string) => void;
  removeVocabularyItem: (id: string) => void;
  videoData: VideoData | null;
  isLoading: boolean;
  error: string | null;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

export function WatchPageProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();
  const searchParams = useSearchParams();
  const urlVideoId = searchParams.get('v');

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeVideoId, setActiveVideoId] = useState<string | null>(urlVideoId);

  // Effect to fetch the last video ID if none is in the URL
  useEffect(() => {
    if (urlVideoId) {
      setActiveVideoId(urlVideoId);
      return;
    }

    if (user && firestore) {
      const fetchLastVideo = async () => {
        setIsLoading(true);
        try {
          const videosQuery = query(
            collection(firestore, `users/${user.uid}/videos`),
            orderBy("timestamp", "desc"),
            limit(1)
          );
          const querySnapshot = await getDocs(videosQuery);
          if (!querySnapshot.empty) {
            const lastVideo = querySnapshot.docs[0];
             // Filter out placeholder if it's the most recent
            if (lastVideo.id !== '_placeholder') {
                setActiveVideoId(lastVideo.id);
            } else if (querySnapshot.docs.length > 1) {
                 // This logic is imperfect, ideally we'd fetch more to find the "real" last one
                 // But for now, we just know the placeholder isn't what we want.
                 setError("No recent videos found to display.");
                 setIsLoading(false);
            } else {
                setError("No videos found in your history.");
                setIsLoading(false);
            }
          } else {
             setError("No videos found in your history.");
             setIsLoading(false);
          }
        } catch (e: any) {
          console.error("Error fetching last video:", e);
          setError("Could not load your video history.");
          setIsLoading(false);
        }
      };
      fetchLastVideo();
    } else if (!user) {
        // If there's no user, there's no history to fetch.
        setIsLoading(false);
    }
  }, [urlVideoId, user, firestore]);

  // Effect to fetch already-cached data from Firestore based on activeVideoId
  useEffect(() => {
    if (!activeVideoId) {
       if (!error) { // Only set loading to false if not already in an error state
         setIsLoading(false);
       }
      return;
    }

    if (!user || !firestore) {
      setError("Authentication or database service is not available.");
      setIsLoading(false);
      return;
    }

    if (videoData?.videoId === activeVideoId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    setVideoData(null);

    async function fetchCachedVideoData() {
      try {
        const videoDocRef = doc(firestore, `users/${user!.uid}/videos/${activeVideoId}`);
        const transcriptDocRef = doc(firestore, `users/${user!.uid}/videos/${activeVideoId}/transcripts`, activeVideoId);
        
        const videoDocSnap = await getDoc(videoDocRef);
        const transcriptDocSnap = await getDoc(transcriptDocRef);

        if (videoDocSnap.exists() && transcriptDocSnap.exists()) {
          const combinedData: VideoData = {
            title: videoDocSnap.data().title,
            description: videoDocSnap.data().description,
            stats: videoDocSnap.data().stats,
            transcript: transcriptDocSnap.data().content,
            videoId: activeVideoId
          };
          setVideoData(combinedData);
        } else {
          setError("Could not find pre-processed data for this video. Please try again from the homepage.");
        }
      } catch (e: any) {
        console.error("Error fetching cached video data:", e);
        setError(e.message || "An error occurred while loading video data.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCachedVideoData();

  }, [activeVideoId, user, firestore, videoData?.videoId, error]);


  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/vocabularies`));
  }, [user, firestore]);

  const { data: allVocabulary, setData: setAllVocabulary } = useCollection<VocabularyItem>(vocabQuery);

  const savedWordsSet = useMemo(() => {
    return new Set(allVocabulary?.map(item => item.word) ?? []);
  }, [allVocabulary]);


  const addVocabularyItem = useCallback(async (word: string) => {
    if (!user || !firestore || !activeVideoId) return;

    const cleanedWord = word.toLowerCase().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g,"");
    if (!cleanedWord || savedWordsSet.has(cleanedWord)) return;
    
    const tempId = `temp_${Date.now()}`;
    const optimisticItem: VocabularyItem = {
      id: tempId,
      word: cleanedWord,
      translation: 'Translating...',
      userId: user.uid,
      videoId: activeVideoId,
    };

    // Optimistic UI update
    setAllVocabulary(prev => [optimisticItem, ...(prev || [])]);

    try {
        const { translation } = await translateWord({ word: cleanedWord, sourceLang: 'en', targetLang: 'ar' });

        const vocabCollectionRef = collection(firestore, `users/${user.uid}/vocabularies`);
        const docRef = await addDoc(vocabCollectionRef, {
            word: cleanedWord,
            translation: translation || 'No translation found',
            userId: user.uid,
            videoId: activeVideoId,
        });

        // Replace temporary item with real one from Firestore
        setAllVocabulary(prev => prev?.map(item => item.id === tempId ? { ...item, id: docRef.id, translation: translation || 'No translation found' } : item));

    } catch (e: any) {
        console.error("Failed to translate or save word", e);
        // Revert optimistic update on failure
        setAllVocabulary(prev => prev?.filter(item => item.id !== tempId) || null);
    }

  }, [user, firestore, activeVideoId, savedWordsSet, setAllVocabulary]);

  const removeVocabularyItem = useCallback(async (id: string) => {
      if (!firestore || !user) return;
      if (id.startsWith('temp_')) {
          setAllVocabulary(prev => prev?.filter(item => item.id !== id) || null);
          return;
      }
      const docRef = doc(firestore, `users/${user.uid}/vocabularies`, id);
      await deleteDoc(docRef);
  }, [firestore, user, setAllVocabulary]);


  const value = {
    vocabulary: allVocabulary ?? [],
    savedWordsSet,
    addVocabularyItem,
    removeVocabularyItem,
    videoData,
    isLoading,
    error,
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
