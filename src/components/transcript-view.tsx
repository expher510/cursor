
"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";
import { cn } from "@/lib/utils";
import { useTranslationStore } from "@/hooks/use-translation-store";
import { useMemo } from "react";
import { Volume2 } from "lucide-react";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  videoId: string;
};

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const { addVocabularyItem, savedWordsSet } = useWatchPage();
  const { translations, toggleTranslation, isTranslating } = useTranslationStore();

  const fullText = useMemo(() => transcript.map(line => line.text).join(' '), [transcript]);
  const isRtl = useMemo(() => /[\u0600-\u06FF]/.test(fullText), [fullText]);

  const handleWordClick = (word: string, originalText: string, key: string) => {
    const isSaved = savedWordsSet.has(word);
    
    if (!isSaved) {
        addVocabularyItem(word);
    }

    toggleTranslation(word, originalText, key);
  };
  
  const speakWord = (e: React.MouseEvent, word: string) => {
      e.stopPropagation();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // Stop any currently speaking utterance
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = 'en-US'; // Set the language
          window.speechSynthesis.speak(utterance);
      }
  };


  return (
    <div className={cn("p-4 leading-relaxed text-lg", isRtl && "text-right")} dir={isRtl ? "rtl" : "ltr"}>
      {fullText.split(/(\s+)/).map((word, wordIndex) => {
        const originalText = word;
        const key = `${wordIndex}`;
        
        if (!word.trim()) {
          return <span key={`${key}-space`}>{word}</span>;
        }
        
        const cleanedWord = word
          .toLowerCase()
          .replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");

        const isSaved = savedWordsSet.has(cleanedWord);
        const translation = translations[key];
        const displayedText = translation ? translation.translatedText : originalText;
        const isCurrentlyTranslating = isTranslating[key];

        return (
            <span key={key} className="inline-block relative group/word">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto px-1 py-0.5 font-medium text-lg hover:bg-primary/10 text-foreground align-baseline",
                  isSaved && !translation && "bg-amber-100 text-amber-900 cursor-help",
                  translation && "bg-blue-100 text-blue-900"
                )}
                onClick={() => handleWordClick(cleanedWord, originalText, key)}
                disabled={isCurrentlyTranslating || !cleanedWord}
              >
                {isCurrentlyTranslating ? '...' : displayedText}
              </Button>
               <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-6 right-1/2 translate-x-1/2 h-6 w-6 z-10 opacity-0 group-hover/word:opacity-100 transition-opacity"
                    onClick={(e) => speakWord(e, cleanedWord)}
                >
                    <Volume2 className="h-4 w-4" />
                    <span className="sr-only">Speak</span>
                </Button>
            </span>
        );
      })}
    </div>
  );
}
