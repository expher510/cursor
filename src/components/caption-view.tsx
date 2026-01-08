"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";
import { useWatchPage } from "@/context/watch-page-context";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type CaptionViewProps = {
  transcript: TranscriptItem[];
  currentTime: number; // in milliseconds
};

export function CaptionView({ transcript, currentTime }: CaptionViewProps) {
  const { addVocabularyItem, savedWordsSet } = useWatchPage();
  
  const activeLine = useMemo(() => {
    if (!transcript || transcript.length === 0) {
      return null;
    }
    
    // Find the single, most appropriate line for the current time.
    // This will be the last line that has started.
    let currentLine: TranscriptItem | null = null;
    for (const line of transcript) {
        if (line.offset <= currentTime) {
            currentLine = line;
        } else {
            break; // Stop as soon as we pass the current time
        }
    }
    return currentLine;

  }, [transcript, currentTime]);

  const renderContent = () => {
    if (!activeLine) {
       return <span>...</span>;
    }
    
    const line = activeLine; // We now have a single line object

    return (
        <span key={line.offset}>
            {line.text.split(/(\s+)/).map((word, wordIndex) => {
              const cleanedWord = word.toLowerCase().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g,"");
              const key = `${line.offset}-${wordIndex}`;
              
              if (!cleanedWord) {
                return <span key={key}>{word}</span>;
              }

              const isSaved = savedWordsSet.has(cleanedWord);

              return (
                <Button 
                  key={key}
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                      "h-auto px-1 py-0.5 text-xl font-semibold leading-relaxed hover:bg-primary/10 disabled:opacity-100 disabled:cursor-default text-foreground",
                       isSaved && "bg-primary/20 text-primary cursor-default"
                  )}
                  onClick={() => addVocabularyItem(cleanedWord)}
                  disabled={isSaved}
                >
                  {word}
                </Button>
              );
            })}
        </span>
    );
  };

  return (
    <div className="w-full bg-muted rounded-lg p-4 min-h-[80px] flex items-center justify-center text-center border">
      {transcript.length > 0 ? (
        <p className="text-xl font-semibold text-foreground leading-relaxed">
          {renderContent()}
        </p>
      ) : (
        <Skeleton className="h-8 w-3/4 bg-gray-600" />
      )}
    </div>
  );
}
