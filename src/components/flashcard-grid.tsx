'use client';

import { useMemo, useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useMemoFirebase } from '@/firebase/provider';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { ArrowLeft, Shuffle, Volume2, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';


type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
  videoId: string;
};

function Flashcard({ item }: { item: VocabularyItem }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { firestore, user } = useFirebase();

  const speak = (e: React.MouseEvent, text: string, lang: string = 'en-us') => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Stop any currently playing audio
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    }
  };


  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!firestore || !user) return;
      const docRef = doc(firestore, `users/${user.uid}/vocabularies`, item.id);
      deleteDocumentNonBlocking(docRef);
  };

  return (
    <div className="w-full h-48 perspective" onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className={cn(
          "relative w-full h-full preserve-3d transition-transform duration-500",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front of Card */}
        <div className="absolute w-full h-full backface-hidden rounded-lg border bg-card text-card-foreground shadow-lg flex flex-col items-center justify-center p-4 cursor-pointer">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8" 
            onClick={(e) => speak(e, item.word, 'en-us')}
          >
            <Volume2 className="h-5 w-5" />
            <span className="sr-only">Speak</span>
          </Button>
          <h2 className="text-2xl md:text-3xl font-bold text-center capitalize text-primary">{item.word}</h2>
        </div>

        {/* Back of Card */}
        <div className="absolute w-full h-full backface-hidden rounded-lg border bg-muted text-muted-foreground shadow-lg flex flex-col items-center justify-center p-4 cursor-pointer rotate-y-180">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8" 
            onClick={(e) => speak(e, item.translation, 'ar-sa')}
          >
            <Volume2 className="h-5 w-5" />
            <span className="sr-only">Speak</span>
          </Button>
          <h3 className="text-xl md:text-2xl font-semibold text-center">{item.translation || "No translation yet."}</h3>
        </div>
      </div>
    </div>
  );
}


export function FlashcardGrid() {
  const { firestore, user } = useFirebase();

  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/vocabularies`), orderBy('word'));
  }, [user, firestore]);

  const { data: vocabulary, isLoading } = useCollection<VocabularyItem>(vocabQuery);

  const [shuffledVocab, setShuffledVocab] = useState<VocabularyItem[] | null>(null);

  const currentVocab = useMemo(() => shuffledVocab || vocabulary, [shuffledVocab, vocabulary]);

  const shuffleCards = () => {
    if (vocabulary) {
      setShuffledVocab([...vocabulary].sort(() => Math.random() - 0.5));
    }
  };

  if (isLoading) {
    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
            ))}
        </div>
    );
  }

  if (!vocabulary || vocabulary.length === 0) {
    return (
        <div className="flex flex-col items-center gap-4 text-center border-dashed border rounded-lg p-12">
            <h3 className="text-xl font-semibold">Your Flashcard Deck is Empty</h3>
            <p className="text-muted-foreground">
                Start by adding words from the video transcripts to build your deck.
            </p>
            <Button asChild variant="outline">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Find a Video
                </Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="w-full">
        <div className="mb-6 flex justify-center">
            <Button onClick={shuffleCards} variant="secondary">
                <Shuffle className="mr-2 h-4 w-4" />
                Shuffle Cards
            </Button>
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentVocab?.map((item) => (
                <Flashcard key={item.id} item={item} />
            ))}
        </div>
    </div>
  );
}
