
'use client';

import { useFirebase } from '@/firebase';
import { collection, doc, query, addDoc, deleteDoc, getDoc, setDoc, orderBy, limit, getDocs } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { processVideo, type ProcessVideoOutput } from '@/ai/flows/process-video-flow';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { useSearchParams } from 'next/navigation';
import { type QuizData } from '@/lib/quiz-data';
import { useToast } from '@/hooks/use-toast';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { extractAudio } from '@/ai/flows/extract-audio-flow';
import { extractYouTubeVideoId } from '@/lib/utils';


type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
  videoId: string;
  userId: string;
};

type VideoData = ProcessVideoOutput & { videoId?: string; audioUrl?: string; title?: string, description?: string };


type WatchPageContextType = {
  vocabulary: VocabularyItem[];
  savedWordsSet: Set<string>;
  addVocabularyItem: (word: string) => void;
  removeVocabularyItem: (id: string) => void;
  videoData: VideoData | null;
  quizData: QuizData | null;
  isLoading: boolean;
  error: string | null;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

export function WatchPageProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();
  const searchParams = useSearchParams();
  const urlVideoId = searchParams.get('v');
  const { toast } = useToast();

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
            if (lastVideo.id !== '_placeholder') {
                setActiveVideoId(lastVideo.id);
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
        setIsLoading(false);
    }
  }, [urlVideoId, user, firestore]);

  // Effect to fetch OR process video data based on activeVideoId
  useEffect(() => {
    if (!activeVideoId) {
       if (!error) { 
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

    async function fetchAndProcessVideoData() {
      // Ensure we are only using the 11-character video ID
      const cleanVideoId = extractYouTubeVideoId(activeVideoId);
      if (!cleanVideoId) {
          setError("The provided YouTube URL or ID is invalid.");
          setIsLoading(false);
          return;
      }

      try {
        const videoDocRef = doc(firestore, `users/${user!.uid}/videos`, cleanVideoId);
        const transcriptDocRef = doc(firestore, `users/${user!.uid}/videos/${cleanVideoId}/transcripts`, cleanVideoId);
        
        const videoDocSnap = await getDoc(videoDocRef);
        const transcriptDocSnap = await getDoc(transcriptDocRef);

        if (videoDocSnap.exists() && transcriptDocSnap.exists()) {
           toast({ variant: 'subtle', title: "Loading Existing Lesson"});
          const videoDocData = videoDocSnap.data();
          const combinedData: VideoData = {
            title: videoDocData.title, // Title may not exist, that's OK
            description: videoDocData.description,
            audioUrl: videoDocData.audioUrl,
            transcript: transcriptDocSnap.data().content,
            videoId: cleanVideoId
          };
          setVideoData(combinedData);
        } else {
          toast({ title: "Processing New Video", description: "Please wait while we prepare your lesson." });
          const result = await processVideo({ videoId: cleanVideoId });
          const { audioUrl } = await extractAudio({ videoId: cleanVideoId });
          
          await setDoc(videoDocRef, {
              id: cleanVideoId,
              title: `Video: ${cleanVideoId}`, // Generic title
              userId: user.uid,
              timestamp: Date.now(),
              audioUrl: audioUrl,
          }, { merge: true });

          await setDoc(transcriptDocRef, {
              id: cleanVideoId,
              videoId: cleanVideoId,
              content: result.transcript,
          }, { merge: true });

          const transcriptText = result.transcript.map(t => t.text).join(' ');
          const vocabForQuiz = Array.from(new Set(
                result.transcript
                .flatMap(item => item.text.split(' '))
                .map(word => word.toLowerCase().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g,""))
                .filter(Boolean)
            )).slice(0, 15);
          
          const quizQuestions = await generateQuiz({
              transcript: transcriptText,
              vocabulary: vocabForQuiz.map(word => ({word, translation: ''}))
          });
          
          const quizDocRef = doc(firestore, `users/${user.uid}/videos/${cleanVideoId}/quizzes`, 'comprehensive-test');
          await setDoc(quizDocRef, {
            id: 'comprehensive-test',
            videoId: cleanVideoId,
            userId: user.uid,
            questions: quizQuestions.questions,
            userAnswers: [],
            score: 0
          }, { merge: true });

          setVideoData({ ...result, videoId: cleanVideoId, audioUrl: audioUrl, title: `Video: ${cleanVideoId}` });
        }
      } catch (e: any) {
        console.error("Error fetching or processing video data:", e);
        setError(e.message || "An error occurred while loading video data.");
        toast({ variant: "destructive", title: "Processing Failed", description: e.message || "Could not process the video. Please try another one." });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAndProcessVideoData();

  }, [activeVideoId, user, firestore, toast]);


  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/vocabularies`));
  }, [user, firestore]);

  const { data: allVocabulary, setData: setAllVocabulary } = useCollection<VocabularyItem>(vocabQuery);
  
  // Fetch Quiz Data
  const quizQuery = useMemoFirebase(() => {
    if (!user || !firestore || !activeVideoId) return null;
    const cleanVideoId = extractYouTubeVideoId(activeVideoId);
    if (!cleanVideoId) return null;
    return query(collection(firestore, `users/${user.uid}/videos/${cleanVideoId}/quizzes`));
  }, [user, firestore, activeVideoId]);

  const { data: quizzes } = useCollection<QuizData>(quizQuery);
  const quizData = useMemo(() => (quizzes && quizzes.length > 0 ? quizzes[0] : null), [quizzes]);


  const videoVocabulary = useMemo(() => {
    if (!allVocabulary || !activeVideoId) return [];
    const cleanVideoId = extractYouTubeVideoId(activeVideoId);
    return allVocabulary.filter(item => item.videoId === cleanVideoId);
  }, [allVocabulary, activeVideoId]);


  const savedWordsSet = useMemo(() => {
    return new Set(videoVocabulary?.map(item => item.word) ?? []);
  }, [videoVocabulary]);


  const addVocabularyItem = useCallback(async (word: string) => {
    if (!user || !firestore || !activeVideoId) return;
    const cleanVideoId = extractYouTubeVideoId(activeVideoId);
    if (!cleanVideoId) return;

    const cleanedWord = word.toLowerCase().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g,"");
    if (!cleanedWord || savedWordsSet.has(cleanedWord)) return;
    
    const tempId = `temp_${Date.now()}`;
    const optimisticItem: VocabularyItem = {
      id: tempId,
      word: cleanedWord,
      translation: 'Translating...',
      userId: user.uid,
      videoId: cleanVideoId,
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
            videoId: cleanVideoId,
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
    vocabulary: videoVocabulary,
    savedWordsSet,
    addVocabularyItem,
    removeVocabularyItem,
    videoData,
    quizData,
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
