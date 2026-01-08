'use client';

import { useFirebase } from '@/firebase';
import { collection, doc, query, addDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect, useRef } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { type ProcessVideoOutput, processVideo } from '@/ai/flows/process-video-flow';
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
  const videoId = searchParams.get('v');

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If there's no videoId, don't do anything.
    if (!videoId) {
      setIsLoading(false);
      setError("No video selected. Please go back and choose a video.");
      return;
    }

    // If data for the current videoId is already loaded, don't refetch.
    if (videoData && videoData.videoId === videoId) {
      if (isLoading) setIsLoading(false);
      return;
    }

    async function fetchAndSetVideoData() {
      if (!user || !firestore) {
        setError("User or database not available.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setVideoData(null); // Clear previous video data
      
      try {
        const videoDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}`);
        const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${videoId}/transcripts`, videoId);
        
        const videoDocSnap = await getDoc(videoDocRef);
        const transcriptDocSnap = await getDoc(transcriptDocRef);

        let processedData;

        if (videoDocSnap.exists() && transcriptDocSnap.exists()) {
          console.log("Found video and transcript in Firestore. Loading from cache.");
          processedData = {
              title: videoDocSnap.data().title,
              description: videoDocSnap.data().description,
              stats: videoDocSnap.data().stats,
              transcript: transcriptDocSnap.data().content,
          };
        } else {
            console.log("Video not in Firestore. Fetching from API and caching.");
            const result = await processVideo({ videoId });
            
            // Cache the new data to Firestore
            await setDoc(videoDocRef, {
                id: videoId,
                title: result.title,
                description: result.description,
                stats: result.stats,
                userId: user.uid,
                timestamp: Date.now(),
            }, { merge: true });

            await setDoc(transcriptDocRef, {
                id: videoId,
                videoId: videoId,
                content: result.transcript,
            }, { merge: true });

            processedData = result;
        }

        setVideoData({
          ...processedData,
          videoId: videoId
        });

      } catch (e: any) {
        console.error("Error processing video:", e);
        setError(e.message || "An unknown error occurred while processing the video.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAndSetVideoData();

  }, [videoId, user, firestore, videoData, isLoading]);



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

  const videoVocabulary = useMemo(() => {
    if (!allVocabulary || !videoId) return allVocabulary || [];
    return allVocabulary.filter(item => item.videoId === videoId);
  }, [allVocabulary, videoId]);

  const savedWordsSet = useMemo(() => {
    return new Set(videoVocabulary?.map(item => item.word) ?? []);
  }, [videoVocabulary]);


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
        await addDoc(vocabCollectionRef, {
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
