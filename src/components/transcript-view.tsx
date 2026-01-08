
"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";
import { cn } from "@/lib/utils";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  videoId: string;
};

export function TranscriptView({ transcript, videoId }: TranscriptViewProps) {
  const { addVocabularyItem, savedWordsSet } = useWatchPage();

  return (
    <ScrollArea className="h-auto">
      <p className="p-4 leading-relaxed text-lg">
        {transcript.map((line) =>
          line.text.split(/(\s+)/).map((word, wordIndex) => {
            if (!word.trim()) {
              return <span key={`${line.offset}-${wordIndex}-space`}>{word}</span>;
            }

            const cleanedWord = word
              .toLowerCase()
              .replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");
            const isSaved = savedWordsSet.has(cleanedWord);

            return (
              <Button
                key={`${line.offset}-${wordIndex}`}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto px-1 py-0.5 font-medium text-base hover:bg-primary/10 text-foreground align-baseline",
                  isSaved && "text-primary hover:bg-transparent cursor-default"
                )}
                onClick={() => addVocabularyItem(cleanedWord)}
                disabled={isSaved || !cleanedWord}
              >
                {word}
              </Button>
            );
          })
        )}
      </p>
    </ScrollArea>
  );
}
