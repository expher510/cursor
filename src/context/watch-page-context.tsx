
'use client';

import { useFirebase } from '@/firebase';
import { collection, doc, query, addDoc, deleteDoc, getDoc, setDoc, orderBy, limit, getDocs } from 'firebase/firestore';
import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { translateWord } from '@/ai/flows/translate-word-flow';
import { useSearchParams } from 'next/navigation';
import { type QuizData, UserAnswer, QuizQuestion, TranscriptItem } from '@/lib/quiz-data';
import { useToast } from '@/hooks/use-toast';
import { extractYouTubeVideoId } from '@/lib/utils';
import { generateQuizFromTranscript, GenerateQuizExtendedOutput } from '@/ai/flows/generate-quiz-from-transcript-flow';
import { useUserProfile } from '@/hooks/use-user-profile';
import { processVideo, type ProcessVideoOutput } from '@/ai/flows/process-video-flow';


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
  addVocabularyItem: (word: string, context: string) => void;
  removeVocabularyItem: (id: string) => void;
  videoData: VideoData | null;
  quizData: QuizData | null;
  hardcodedQuizData: QuizData | null;
  combinedQuizData: QuizData | null;
  isLoading: boolean;
  error: string | null;
  handleQuizGeneration: () => void;
  isGeneratingQuiz: boolean;
  saveQuizResults: (results: { score: number, userAnswers: UserAnswer[] }) => void;
};

const WatchPageContext = createContext<WatchPageContextType | undefined>(undefined);

// Helper function to shuffle an array
const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

type WatchPageProviderProps = {
    children: ReactNode;
    activeVideoId?: string | null;
    shouldGenerate?: boolean;
};


export function WatchPageProvider({ children, activeVideoId: passedVideoId, shouldGenerate: passedShouldGenerate = false }: WatchPageProviderProps) {
  const { firestore, user } = useFirebase();
  const { userProfile } = useUserProfile();
  const searchParams = useSearchParams();
  const urlVideoId = searchParams.get('v');
  const urlShouldGenerate = searchParams.get('shouldGenerate') !== 'false';
  const { toast } = useToast();

  const activeVideoId = passedVideoId ?? urlVideoId;
  const shouldGenerate = passedShouldGenerate || urlShouldGenerate;


  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [hardcodedQuizData, setHardcodedQuizData] = useState<QuizData | null>(null);
  
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(activeVideoId);

  // Effect to fetch the last video ID if none is in the URL
  useEffect(() => {
    if (activeVideoId) {
      setCurrentVideoId(activeVideoId);
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
                setCurrentVideoId(lastVideo.id);
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
  }, [activeVideoId, user, firestore]);

  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/vocabularies`));
  }, [user, firestore]);

  const { data: allVocabulary, setData: setAllVocabulary } = useCollection<VocabularyItem>(vocabQuery);

  const videoVocabulary = useMemo(() => {
    if (!allVocabulary || !currentVideoId) return [];
    const cleanVideoId = extractYouTubeVideoId(currentVideoId);
    return allVocabulary.filter(item => item.videoId === cleanVideoId);
  }, [allVocabulary, currentVideoId]);

  const generateAndStoreHardcodedQuestions = useCallback(async (
    currentVideoData: VideoData,
    currentVideoVocabulary: VocabularyItem[]
  ) => {
    if (!firestore || !user || !currentVideoData.videoId) return;
  
    const hardcodedQuestions: QuizQuestion[] = [];
  
    // 1. Vocabulary Translation Questions
    if (currentVideoVocabulary.length >= 4) {
      const shuffledVocab = shuffleArray(currentVideoVocabulary);
      for (let i = 0; i < Math.min(5, shuffledVocab.length); i++) {
        const correctVocab = shuffledVocab[i];
        const wrongOptions = shuffleArray(shuffledVocab.filter(v => v.id !== correctVocab.id))
          .slice(0, 3)
          .map(v => v.translation);
        
        const options = shuffleArray([correctVocab.translation, ...wrongOptions]);
  
        hardcodedQuestions.push({
          questionText: `What is the translation of "${correctVocab.word}"?`,
          options: options,
          correctAnswer: correctVocab.translation,
        });
      }
    }
  
    // 2. Fill-in-the-Blank Questions
    const transcript = currentVideoData.transcript;
    if (transcript.length >= 2) {
      for (let i = 0; i < 5; i++) {
        // Find a random spot to start
        const startIndex = Math.floor(Math.random() * (transcript.length - 1));
        const sentence1 = transcript[startIndex].text;
        const sentence2 = transcript[startIndex + 1].text;
        const combined = `${sentence1} ${sentence2}`;
        const words = combined.split(' ').filter(w => w.length > 2); // Get words longer than 2 chars
  
        if (words.length < 5) continue;
  
        // Pick a word from the middle to remove
        const middleIndex = Math.floor(words.length / 2) + Math.floor(Math.random() * 3) - 1;
        const removedWord = words[middleIndex];
        words[middleIndex] = '______';
        const questionText = words.join(' ');
  
        // Get 3 other random words from the transcript as wrong options
        const allWords = transcript.flatMap(t => t.text.split(' ')).filter(w => w.length > 2 && w !== removedWord);
        const wrongOptions = shuffleArray([...new Set(allWords)]).slice(0, 3);
  
        if (wrongOptions.length < 3) continue;
  
        const options = shuffleArray([removedWord, ...wrongOptions]);
  
        hardcodedQuestions.push({
          questionText: `Fill in the blank: "${questionText}"`,
          options: options,
          correctAnswer: removedWord,
        });
      }
    }
  
    if (hardcodedQuestions.length > 0) {
      const quizDocRef = doc(firestore, `users/${user.uid}/videos/${currentVideoData.videoId}/quizzes`, 'hardcoded-questions');
      const newQuizData: QuizData = {
        id: 'hardcoded-questions',
        videoId: currentVideoData.videoId,
        userId: user.uid,
        questions: hardcodedQuestions,
      };
      await setDoc(quizDocRef, newQuizData, { merge: true });
      setHardcodedQuizData(newQuizData);
    }
  
  }, [firestore, user]);


  // Effect to fetch OR process video data based on currentVideoId
  useEffect(() => {
    if (!currentVideoId) {
       if (!error) { 
         setIsLoading(false);
       }
      return;
    }

    if (!user || !firestore) {
      setError("Authentication, database, or user profile service is not available.");
      setIsLoading(false);
      return;
    }

    if (videoData?.videoId === currentVideoId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    setVideoData(null);
    setQuizData(null); // Reset AI quiz data when video changes
    setHardcodedQuizData(null); // Reset hardcoded quiz data

    async function fetchAndProcessVideoData() {
      if (!currentVideoId) {
        setError("Video ID is missing.");
        setIsLoading(false);
        return;
      }
      const cleanVideoId = extractYouTubeVideoId(currentVideoId);
      if (!cleanVideoId) {
          setError("The provided YouTube URL or ID is invalid.");
          setIsLoading(false);
          return;
      }

      try {
        if (!user) {
            setError("User session is not available.");
            setIsLoading(false);
            return;
        }
        const videoDocRef = doc(firestore, `users/${user.uid}/videos`, cleanVideoId);
        const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${cleanVideoId}/transcripts`, cleanVideoId);
        const hardcodedQuizDocRef = doc(firestore, `users/${user.uid}/videos/${cleanVideoId}/quizzes`, 'hardcoded-questions');
        
        const [videoDocSnap, transcriptDocSnap, hardcodedQuizSnap] = await Promise.all([
          getDoc(videoDocRef),
          getDoc(transcriptDocRef),
          getDoc(hardcodedQuizDocRef)
        ]);

        if (hardcodedQuizSnap.exists()) {
          setHardcodedQuizData(hardcodedQuizSnap.data() as QuizData);
        }

        if (videoDocSnap.exists() && transcriptDocSnap.exists()) {
          const videoDocData = videoDocSnap.data();
          const transcriptDocData = transcriptDocSnap.data();
          const combinedData: VideoData = {
            title: videoDocData.title,
            description: videoDocData.description,
            transcript: transcriptDocData.content,
            sourceLang: transcriptDocData.sourceLang || 'en',
            videoId: cleanVideoId,
          };
          setVideoData(combinedData);
          if (!hardcodedQuizSnap.exists()) {
            generateAndStoreHardcodedQuestions(combinedData, videoVocabulary);
          }
        } else if (shouldGenerate) {
          if (!userProfile) {
              setError("User profile not loaded, cannot process new video.");
              setIsLoading(false);
              return;
          }
          toast({ title: "Processing New Video", description: "Please wait while we prepare your lesson." });
          
          const result = await processVideo({ videoId: cleanVideoId, lang: userProfile.targetLanguage });

          if (!user) {
            setError("User not available to save video data.");
            return;
          }

          // Create docs for video and transcript
          await setDoc(videoDocRef, {
              id: cleanVideoId,
              title: result.title,
              description: result.description,
              userId: user.uid,
              timestamp: Date.now(),
          }, { merge: true });

          await setDoc(transcriptDocRef, {
              id: cleanVideoId,
              videoId: cleanVideoId,
              content: result.transcript,
              sourceLang: result.sourceLang,
          }, { merge: true });
          
          const newVideoData = { ...result, videoId: cleanVideoId };
          setVideoData(newVideoData);
          generateAndStoreHardcodedQuestions(newVideoData, videoVocabulary);

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

  }, [currentVideoId, user, firestore, toast, shouldGenerate, userProfile, generateAndStoreHardcodedQuestions, videoVocabulary]);

  const handleQuizGeneration = useCallback(async () => {
    if (!videoData?.transcript || videoData.transcript.length === 0 || !userProfile || !firestore || !user || !videoData?.videoId) {
        toast({ variant: "destructive", title: "Cannot Generate Quiz", description: "A transcript is required to create a quiz. This video may not have one."});
        return;
    }

    // Don't re-generate if we already have AI questions for this session
    if (quizData) return;
    
    setIsGeneratingQuiz(true);

    try {
        const fullTranscript = videoData.transcript.map(t => t.text).join(' ');
        const quizResult: GenerateQuizExtendedOutput = await generateQuizFromTranscript({
            transcript: fullTranscript,
            targetLanguage: userProfile.targetLanguage,
            proficiencyLevel: userProfile.proficiencyLevel
        });

        const newQuizData: QuizData = {
          id: `session_${Date.now()}`,
          videoId: videoData.videoId,
          userId: user.uid,
          questions: quizResult.questions,
        };
        
        setQuizData(newQuizData);

        toast({ title: "Quiz Generated!", description: "Your quiz is ready." });

    } catch (e: any) {
        console.error("Failed to generate quiz on demand:", e);
        toast({ variant: "destructive", title: "Quiz Generation Failed", description: e.message || "An unexpected error occurred." });
    } finally {
        setIsGeneratingQuiz(false);
    }
  }, [videoData, userProfile, firestore, user, toast, quizData]);

  const combinedQuizData = useMemo(() => {
    // Wait until AI generation is finished before combining
    if (isGeneratingQuiz) {
        return null;
    }

    const allQuestions = [
        ...(hardcodedQuizData?.questions || []),
        ...(quizData?.questions || [])
    ];

    if (allQuestions.length === 0) return null;

    return {
        id: quizData?.id || hardcodedQuizData?.id || `combined-quiz-${Date.now()}`,
        videoId: videoData?.videoId,
        questions: allQuestions,
        userId: user?.uid
    };
  }, [quizData, hardcodedQuizData, videoData, isGeneratingQuiz, user]);



  const saveQuizResults = useCallback(async (results: { score: number, userAnswers: UserAnswer[] }) => {
    if (!firestore || !user || !currentVideoId) {
        toast({ variant: "destructive", title: "Error Saving Results", description: "Could not save quiz results. Please try again."});
        return;
    }
    const cleanVideoId = extractYouTubeVideoId(currentVideoId);
    if (!cleanVideoId) return;

    const quizCollectionRef = collection(firestore, `users/${user.uid}/videos/${cleanVideoId}/quizzes`);
    
    try {
        await addDoc(quizCollectionRef, {
            videoId: cleanVideoId,
            userId: user.uid,
            score: results.score,
            userAnswers: results.userAnswers,
            timestamp: Date.now()
        });
        toast({ title: "Quiz Results Saved!", description: "Your score has been recorded."});
    } catch (e: any) {
        console.error("Failed to save quiz results:", e);
        toast({ variant: "destructive", title: "Save Failed", description: "There was a problem saving your quiz results."});
    }
  }, [firestore, user, currentVideoId, toast]);

  const savedWordsSet = useMemo(() => {
    return new Set(videoVocabulary?.map(item => item.word) ?? []);
  }, [videoVocabulary]);


  const addVocabularyItem = useCallback(async (word: string, context: string) => {
    if (!user || !firestore || !currentVideoId || !userProfile || !videoData) return;
    const cleanVideoId = extractYouTubeVideoId(currentVideoId);
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
            nativeLanguage: userProfile.nativeLanguage, 
            context: context 
        });

        const vocabCollectionRef = collection(firestore, `users/${user.uid}/vocabularies`);
        const docRef = await addDoc(vocabCollectionRef, {
            word: cleanedWord,
            translation: translation || 'No translation found',
            userId: user.uid,
            videoId: cleanVideoId,
        });

        setAllVocabulary(prev => (prev || []).map(item => item.id === tempId ? { ...item, id: docRef.id, translation: translation || 'No translation found' } : item));

    } catch (e: any) {
        console.error("Failed to translate or save word", e);
        setAllVocabulary(prev => prev?.filter(item => item.id !== tempId) || null);
    }

  }, [user, firestore, currentVideoId, savedWordsSet, setAllVocabulary, userProfile, videoData]);

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
    hardcodedQuizData,
    combinedQuizData,
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
