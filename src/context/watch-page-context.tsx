
'use client';

import { useFirebase } from '@/firebase';
import { collection, doc, query, addDoc, deleteDoc, getDoc, setDoc, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { processVideo, type ProcessVideoOutput } from '@/ai/flows/process-video-flow';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { useSearchParams } from 'next/navigation';
import { type QuizData, UserAnswer } from '@/lib/quiz-data';
import { useToast } from '@/hooks/use-toast';
import { extractYouTubeVideoId } from '@/lib/utils';
import { generateQuizFromTranscript, GenerateQuizExtendedOutput } from '@/ai/flows/generate-quiz-from-transcript-flow';
import { useUserProfile } from '@/hooks/use-user-profile';


type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
  videoId: string;
  userId: string;
};

type VideoData = ProcessVideoOutput & { videoId?: string; audioUrl?: string; };


type WatchPageContextType = {
  vocabulary: VocabularyItem[];
  savedWordsSet: Set<string>;
  addVocabularyItem: (word: string, context: string) => void;
  removeVocabularyItem: (id: string) => void;
  videoData: VideoData | null;
  quizData: QuizData | null;
  isLoading: boolean;
  error: string | null;
  handleQuizGeneration: () => void;
  isGeneratingQuiz: boolean;
  saveQuizResults: (results: { score: number, userAnswers: UserAnswer[] }) => void;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

export function WatchPageProvider({ children }: { children: ReactNode }) {
  const { firestore, user } = useFirebase();
  const { userProfile } = useUserProfile();
  const searchParams = useSearchParams();
  const urlVideoId = searchParams.get('v');
  const shouldGenerate = searchParams.get('shouldGenerate') !== 'false'; // Default to true
  const { toast } = useToast();

  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  
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

    if (!user || !firestore || !userProfile) {
      setError("Authentication, database, or user profile service is not available.");
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
      const cleanVideoId = extractYouTubeVideoId(activeVideoId);
      if (!cleanVideoId) {
          setError("The provided YouTube URL or ID is invalid.");
          setIsLoading(false);
          return;
      }
      
      const videoUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;

      try {
        const videoDocRef = doc(firestore, `users/${user!.uid}/videos`, cleanVideoId);
        const transcriptDocRef = doc(firestore, `users/${user!.uid}/videos/${cleanVideoId}/transcripts`, cleanVideoId);
        
        const videoDocSnap = await getDoc(videoDocRef);
        const transcriptDocSnap = await getDoc(transcriptDocRef);

        if (videoDocSnap.exists() && transcriptDocSnap.exists()) {
          const videoDocData = videoDocSnap.data();
          const transcriptDocData = transcriptDocSnap.data();
          const combinedData: VideoData = {
            title: videoDocData.title,
            description: videoDocData.description,
            audioUrl: videoDocData.audioUrl || videoUrl,
            transcript: transcriptDocData.content,
            sourceLang: transcriptDocData.sourceLang || 'en',
            videoId: cleanVideoId
          };
          setVideoData(combinedData);
        } else if (shouldGenerate) {
          toast({ title: "Processing New Video", description: "Please wait while we prepare your lesson." });
          
          let result: ProcessVideoOutput;
          try {
            // First, try fetching with the user's target language
            result = await processVideo({ videoId: cleanVideoId, lang: userProfile.targetLanguage });
            toast({ variant: 'subtle', title: `Transcript found in ${userProfile.targetLanguage}!`});
          } catch (e: any) {
             // If target language fails, fall back to English
             if (e.message.includes('No transcript available')) {
                 console.warn(`Transcript not found in ${userProfile.targetLanguage}, falling back to English.`);
                 toast({ variant: 'subtle', title: 'Falling back to English transcript'});
                 result = await processVideo({ videoId: cleanVideoId, lang: 'en' });
             } else {
                 // Re-throw other errors (e.g., video not found, captions disabled)
                 throw e;
             }
          }

          await setDoc(videoDocRef, {
              id: cleanVideoId,
              title: result.title,
              description: result.description,
              userId: user.uid,
              timestamp: Date.now(),
              audioUrl: videoUrl,
          }, { merge: true });

          await setDoc(transcriptDocRef, {
              id: cleanVideoId,
              videoId: cleanVideoId,
              content: result.transcript,
              sourceLang: result.sourceLang,
          }, { merge: true });

          setVideoData({ ...result, videoId: cleanVideoId, audioUrl: videoUrl });
        } else {
            setError("Video data not found. Please process it from the homepage first.");
            toast({ variant: "destructive", title: "Data Not Found", description: "This video hasn't been processed yet. Please add it from the homepage." });
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

  }, [activeVideoId, user, firestore, toast, shouldGenerate, userProfile]);


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

  const { data: quizzes, setData: setQuizzes } = useCollection<QuizData>(quizQuery);
  const quizData = useMemo(() => (quizzes && quizzes.length > 0 ? quizzes[0] : null), [quizzes]);

  const handleQuizGeneration = useCallback(async () => {
    if (!videoData?.transcript || videoData.transcript.length === 0 || !userProfile || !firestore || !user || !videoData?.videoId) {
        toast({ variant: "destructive", title: "Cannot Generate Quiz", description: "A transcript is required to create a quiz. This video may not have one."});
        return;
    }
    
    if (quizData && quizData.questions.length > 0) {
        return;
    }
    
    setIsGeneratingQuiz(true);

    try {
        const fullTranscript = videoData.transcript.map(t => t.text).join(' ');
        const quizResult: GenerateQuizExtendedOutput = await generateQuizFromTranscript({
            transcript: fullTranscript,
            targetLanguage: userProfile.targetLanguage,
            proficiencyLevel: userProfile.proficiencyLevel
        });

        const newQuizData: QuizData = {
          id: 'comprehensive-test',
          videoId: videoData.videoId,
          userId: user.uid,
          questions: quizResult.questions,
          userAnswers: [],
          score: 0
        };

        const quizDocRef = doc(firestore, `users/${user.uid}/videos/${videoData.videoId}/quizzes`, 'comprehensive-test');
        await setDoc(quizDocRef, newQuizData, { merge: true });
        
        setQuizzes([newQuizData]);

        toast({ title: "Quiz Generated!", description: "Your quiz is ready." });

    } catch (e: any) {
        console.error("Failed to generate quiz on demand:", e);
        toast({ variant: "destructive", title: "Quiz Generation Failed", description: e.message || "An unexpected error occurred." });
    } finally {
        setIsGeneratingQuiz(false);
    }
  }, [videoData, userProfile, firestore, user, toast, quizData, setQuizzes]);


  const saveQuizResults = useCallback(async (results: { score: number, userAnswers: UserAnswer[] }) => {
    if (!firestore || !user || !activeVideoId || !quizData?.id) {
        toast({ variant: "destructive", title: "Error Saving Results", description: "Could not save quiz results. Please try again."});
        return;
    }
    const cleanVideoId = extractYouTubeVideoId(activeVideoId);
    if (!cleanVideoId) return;

    const quizDocRef = doc(firestore, `users/${user.uid}/videos/${cleanVideoId}/quizzes`, quizData.id);

    try {
        await updateDoc(quizDocRef, {
            score: results.score,
            userAnswers: results.userAnswers
        });
        toast({ title: "Quiz Results Saved!", description: "Your score has been recorded."});
    } catch (e: any) {
        console.error("Failed to save quiz results:", e);
        toast({ variant: "destructive", title: "Save Failed", description: "There was a problem saving your quiz results."});
    }
  }, [firestore, user, activeVideoId, quizData, toast]);


  const videoVocabulary = useMemo(() => {
    if (!allVocabulary || !activeVideoId) return [];
    const cleanVideoId = extractYouTubeVideoId(activeVideoId);
    return allVocabulary.filter(item => item.videoId === cleanVideoId);
  }, [allVocabulary, activeVideoId]);


  const savedWordsSet = useMemo(() => {
    return new Set(videoVocabulary?.map(item => item.word) ?? []);
  }, [videoVocabulary]);


  const addVocabularyItem = useCallback(async (word: string, context: string) => {
    if (!user || !firestore || !activeVideoId || !userProfile || !videoData) return;
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

    setAllVocabulary(prev => [optimisticItem, ...(prev || [])]);

    try {
        const { translation } = await translateWord({ 
            word: cleanedWord, 
            sourceLang: videoData.sourceLang, 
            targetLang: userProfile.targetLanguage, 
            context: context 
        });

        const vocabCollectionRef = collection(firestore, `users/${user.uid}/vocabularies`);
        const docRef = await addDoc(vocabCollectionRef, {
            word: cleanedWord,
            translation: translation || 'No translation found',
            userId: user.uid,
            videoId: cleanVideoId,
        });

        setAllVocabulary(prev => prev?.map(item => item.id === tempId ? { ...item, id: docRef.id, translation: translation || 'No translation found' } : item));

    } catch (e: any) {
        console.error("Failed to translate or save word", e);
        setAllVocabulary(prev => prev?.filter(item => item.id !== tempId) || null);
    }

  }, [user, firestore, activeVideoId, savedWordsSet, setAllVocabulary, userProfile, videoData]);

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
    handleQuizGeneration,
    isGeneratingQuiz,
    saveQuizResults,
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
