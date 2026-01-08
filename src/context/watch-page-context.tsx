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
  notification: string | null;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

export function WatchPageProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();
  const searchParams = useSearchParams();
  const urlVideoId = searchParams.get('v');

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
            setActiveVideoId(lastVideo.id);
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
    }
  }, [urlVideoId, user, firestore]);

  // Effect to fetch already-cached data from Firestore based on activeVideoId
  useEffect(() => {
    if (!activeVideoId) {
       if (!urlVideoId) { // Only set error if no ID was ever present
          setError("No video ID provided and no history found.");
        }
      setIsLoading(false);
      return;
    }

    if (!user || !firestore) {
      setError("Authentication or database service is not available.");
      setIsLoading(false);
      return;
    }

    // If data is already loaded for this videoId, don't refetch
    if (videoData?.videoId === activeVideoId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    setVideoData(null);

    async function fetchCachedVideoData() {
      try {
        const videoDocRef = doc(firestore, `users/${user.uid}/videos/${activeVideoId}`);
        const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${activeVideoId}/transcripts`, activeVideoId);
        
        const videoDocSnap = await getDoc(videoDocRef);
        const transcriptDocSnap = await getDoc(transcriptDocRef);

        if (videoDocSnap.exists() && transcriptDocSnap.exists()) {
          console.log("Loading video data from Firestore cache for videoId:", activeVideoId);
          const combinedData: VideoData = {
            title: videoDocSnap.data().title,
            description: videoDocSnap.data().description,
            stats: videoDocSnap.data().stats,
            transcript: transcriptDocSnap.data().content,
            videoId: activeVideoId
          };
          setVideoData(combinedData);
        } else {
          console.error("Data not found in cache for videoId:", activeVideoId);
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

  }, [activeVideoId, user, firestore, videoData?.videoId]);


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
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/vocabularies`));
  }, [user, firestore]);

  const { data: allVocabulary } = useCollection<VocabularyItem>(vocabQuery);

  const savedWordsSet = useMemo(() => {
    return new Set(allVocabulary?.map(item => item.word) ?? []);
  }, [allVocabulary]);


  const addVocabularyItem = useCallback(async (word: string) => {
    if (!user || !firestore || !activeVideoId) return;

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
        await addDoc(vocabCollectionRef, {
            word: cleanedWord,
            translation: translation || 'No translation found',
            userId: user.uid,
            videoId: activeVideoId,
        });
        
        showNotification(`Saved!`);

    } catch (e: any) {
        console.error("Failed to translate or save word", e);
        showNotification(`Error saving word.`);
    }

  }, [user, firestore, activeVideoId, savedWordsSet, showNotification]);

  const removeVocabularyItem = useCallback(async (id: string) => {
      if (!firestore || !user) return;
      const docRef = doc(firestore, `users/${user.uid}/vocabularies`, id);
      await deleteDoc(docRef);
  }, [firestore, user]);

  useEffect(() => {
      return () => {
          if(notificationTimeoutRef.current) {
              clearTimeout(notificationTimeoutRef.current);
          }
      }
  }, []);


  const value = {
    vocabulary: allVocabulary ?? [],
    savedWordsSet,
    addVocabularyItem,
    removeVocabularyItem,
    videoData,
    isLoading,
    error,
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
