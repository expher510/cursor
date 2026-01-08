
"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  videoId: string;
};

export function TranscriptView({ transcript, videoId }: TranscriptViewProps) {
  const { addVocabularyItem, vocabulary, savedWordsSet } = useWatchPage();

  const vocabMap = useMemo(() => {
    const map = new Map<string, string>();
    if (vocabulary) {
      for (const item of vocabulary) {
        map.set(item.word, item.translation);
      }
    }
    return map;
  }, [vocabulary]);

  return (
    <ScrollArea className="h-auto">
      <div className="p-1 leading-relaxed text-lg">
        {transcript.map((line, lineIndex) => (
          <span key={`${line.offset}-${lineIndex}`}>
            {line.text.split(/(\s+)/).map((word, wordIndex) => {
              if (!word.trim()) {
                return <span key={`${line.offset}-${lineIndex}-space-${wordIndex}`}>{word}</span>;
              }
              
              const cleanedWord = word.toLowerCase().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g,"");
              const key = `${line.offset}-${lineIndex}-${wordIndex}`;
              const isSaved = savedWordsSet.has(cleanedWord);

              return (
                <Button 
                  key={key}
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-auto px-1 py-0.5 font-medium text-base hover:bg-primary/10 text-foreground",
                    isSaved && "text-primary hover:bg-transparent cursor-default"
                  )}
                  onClick={() => addVocabularyItem(cleanedWord)}
                  disabled={isSaved || !cleanedWord}
                >
                  {word}
                </Button>
              );
            })}
          </span>
        ))}
      </div>
    </ScrollArea>
  );
}
