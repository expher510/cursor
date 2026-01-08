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

    const PREDICTIVE_BUFFER = 250; 

    const activeLines = transcript.filter(line => 
      currentTime >= (line.offset - PREDICTIVE_BUFFER) && currentTime < (line.offset + line.duration)
    );

    if (activeLines.length > 0) {
      return activeLines;
    }

    let lastLine: TranscriptItem | null = null;
    for (const line of transcript) {
        if (line.offset <= currentTime) {
            lastLine = line;
        } else {
            break;
        }
    }
    
    return lastLine ? [lastLine] : null;

  }, [transcript, currentTime]);

  const renderContent = () => {
    if (!activeLine) {
       return <span>...</span>;
    }
    
    return activeLine.map((line, lineIndex) => (
        <span key={`${line.offset}-${lineIndex}`}>
            {line.text.split(/(\s+)/).map((word, wordIndex) => {
              const cleanedWord = word.toLowerCase().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g,"");
              const key = `${line.offset}-${lineIndex}-${wordIndex}`;
              
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
                      "h-auto px-1 py-0.5 text-xl font-semibold leading-relaxed hover:bg-white/20 disabled:opacity-100 disabled:cursor-default text-white",
                       isSaved && "bg-yellow-500/20 text-yellow-300 cursor-default"
                  )}
                  onClick={() => addVocabularyItem(cleanedWord)}
                  disabled={isSaved}
                >
                  {word}
                </Button>
              );
            })}
          </span>
    ));
  };

  return (
    <div className="w-full bg-black/75 rounded-lg p-4 min-h-[80px] flex items-center justify-center text-center">
      {transcript.length > 0 ? (
        <p className="text-xl font-semibold text-white leading-relaxed">
          {renderContent()}
        </p>
      ) : (
        <Skeleton className="h-8 w-3/4 bg-gray-600" />
      )}
    </div>
  );
}
