'use client';
import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCw, Wand2, Shuffle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase } from '@/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
};

type WordBankItem = {
  word: string;
  used: boolean;
};

function WritingExerciseView({ initialWords }: { initialWords: string[] }) {
    const [wordBank, setWordBank] = useState<WordBankItem[]>([]);
    const [text, setText] = useState('');
    const router = useRouter();

    useEffect(() => {
        setWordBank(initialWords.map(word => ({ word, used: false })));
    }, [initialWords]);

    const handleWordClick = (word: string) => {
        setText(prev => prev ? `${prev.trim()} ${word}` : word);
        setWordBank(prev => prev.map(item => item.word === word ? { ...item, used: true } : item));
    };
    
    const handleReset = () => {
        setText('');
        setWordBank(prev => prev.map(item => ({ ...item, used: false })));
    };

    const handleConfirm = () => {
        // For now, just navigates home as requested.
        router.push('/');
    };

    const allWordsUsed = useMemo(() => wordBank.every(item => item.used), [wordBank]);

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <CardTitle>Free Writing Practice</CardTitle>
                <CardDescription>Use the words below to write a story, a sentence, or anything you like. Click a word to use it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Word Bank */}
                <div className="p-4 rounded-lg border bg-muted min-h-[80px]">
                    {wordBank.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {wordBank.map((item, index) => (
                                !item.used && (
                                    <Button
                                        key={index}
                                        variant="secondary"
                                        onClick={() => handleWordClick(item.word)}
                                        className="capitalize shadow-sm"
                                    >
                                        {item.word}
                                    </Button>
                                )
                            ))}
                            {allWordsUsed && (
                                <p className="text-sm text-muted-foreground">Great job! You've used all the words.</p>
                            )}
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground text-center">No words to practice. Try adding some from a video!</p>
                    )}
                </div>
                
                {/* Text Area */}
                <Textarea 
                    placeholder="Start writing here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="text-base"
                />

                {/* Actions */}
                <div className="flex justify-between items-center gap-4">
                     <Button variant="ghost" onClick={handleReset}><RefreshCw className="mr-2 h-4 w-4" /> Reset</Button>
                    <Button onClick={handleConfirm} disabled={!allWordsUsed && wordBank.length > 0}>
                        Confirm
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


function WritingExerciseGenerator() {
    const searchParams = useSearchParams();
    const videoId = searchParams.get('v');
    const { firestore, user } = useFirebase();

    const [words, setWords] = useState<string[]>([]);
    const [numWords, setNumWords] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWords = useCallback(async (count: number) => {
        if (!user || !firestore) {
            setError("You must be logged in to start an exercise.");
            return [];
        }
        
        let allAvailableWords: string[] = [];

        // 1. Get words from the global vocabulary list first
        const vocabColRefGlobal = collection(firestore, `users/${user.uid}/vocabularies`);
        const vocabSnapshot = await getDocs(query(vocabColRefGlobal, limit(50)));
        const globalWords = vocabSnapshot.docs.map(d => d.data().word);
        allAvailableWords = [...new Set(globalWords)];


        // 2. If still not enough, get from random video transcript
        if (allAvailableWords.length < count) {
             const videosQuery = query(collection(firestore, `users/${user.uid}/videos`), limit(10));
             const videosSnapshot = await getDocs(videosQuery);
             if (!videosSnapshot.empty) {
                const randomVideo = videosSnapshot.docs[Math.floor(Math.random() * videosSnapshot.docs.length)];
                if (randomVideo.id !== '_placeholder') {
                    const transcriptRef = doc(firestore, `users/${user.uid}/videos/${randomVideo.id}/transcripts`, randomVideo.id);
                    const transcriptSnap = await getDoc(transcriptRef);
                    if (transcriptSnap.exists()) {
                        const transcriptText = transcriptSnap.data().content.map((t: any) => t.text).join(' ');
                        const transcriptWords = transcriptText.split(/\s+/).filter(w => w.length > 3 && isNaN(Number(w)));
                        allAvailableWords = [...new Set([...allAvailableWords, ...transcriptWords])];
                    }
                }
             }
        }

        // 3. Shuffle and slice
        return allAvailableWords.sort(() => 0.5 - Math.random()).slice(0, count);

    }, [user, firestore]);
    
    
    const handleStartExercise = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedWords = await fetchWords(numWords);
            if (fetchedWords.length === 0) {
                 setError("Could not find any words to practice. Try watching a video and saving some vocabulary first.");
            }
            setWords(fetchedWords);
        } catch(e: any) {
            console.error("Error fetching words:", e);
            setError(e.message || "An unexpected error occurred while preparing your exercise.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchWords, numWords]);


    if (isLoading) {
        return (
            <Card className="w-full max-w-md text-center">
                 <CardHeader>
                    <CardTitle>Prepare Your Exercise</CardTitle>
                    <CardDescription>Getting things ready...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-24">
                     <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }
    
     if (error) {
        return (
            <Card className="w-full max-w-xl border-destructive bg-destructive/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle/> Error</CardTitle>
                    <CardDescription className="text-destructive/80">{error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>We couldn't prepare the writing exercise. Please check your connection or try again later.</p>
                     <Button onClick={handleStartExercise} variant="secondary" className="mt-4">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (words.length > 0) {
        return <WritingExerciseView initialWords={words} />;
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Setup Writing Practice</CardTitle>
                <CardDescription>Choose how many words you want to practice with.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <label htmlFor="num-words" className="font-medium">Number of words:</label>
                    <Input 
                        id="num-words"
                        type="number"
                        value={numWords}
                        onChange={(e) => setNumWords(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                        className="w-24"
                    />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setNumWords(Math.floor(Math.random() * 10) + 3)}
                    >
                        <Shuffle className="h-5 w-5" />
                        <span className="sr-only">Randomize</span>
                    </Button>
                </div>
                 <Button onClick={handleStartExercise} className="w-full" size="lg">
                    <Wand2 className="mr-2" />
                    Generate Exercise
                </Button>
            </CardContent>
        </Card>
    );
}

// Main Page Component
export default function WritingExercisePage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
            <WritingExerciseGenerator />
        </Suspense>
      </main>
    </>
  );
}
