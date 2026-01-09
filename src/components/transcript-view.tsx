
"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";
import { cn } from "@/lib/utils";
import { useTranslationStore } from "@/hooks/use-translation-store";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  videoId: string;
};

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const { addVocabularyItem, savedWordsSet } = useWatchPage();
  const { translations, toggleTranslation, isTranslating } = useTranslationStore();

  const fullText = transcript.map(line => line.text).join(' ');

  const handleWordClick = (word: string, originalText: string, key: string) => {
    const isSaved = savedWordsSet.has(word);
    
    if (!isSaved) {
        addVocabularyItem(word);
    }

    toggleTranslation(word, originalText, key);
  };


  return (
    <div className="p-4 leading-relaxed text-lg">
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
          <Button
            key={key}
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
        );
      })}
    </div>
  );
}
