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
  const { addVocabularyItem } = useWatchPage();

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

              return (
                <Button 
                  key={key}
                  variant="ghost" 
                  size="sm" 
                  className="h-auto px-1 py-0.5 font-medium text-base hover:bg-primary/10 text-foreground"
                  onClick={() => addVocabularyItem(cleanedWord, videoId)}
                  disabled={!cleanedWord}
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
