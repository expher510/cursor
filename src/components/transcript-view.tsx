"use client";

import { useMemo } from "react";
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
  const { addVocabularyItem, vocabulary } = useWatchPage();
  
  const savedWords = useMemo(() => {
    return new Set(vocabulary.map(item => item.word));
  }, [vocabulary]);

  return (
    <ScrollArea className="h-[400px] md:h-auto md:flex-1">
        <div className="p-1 leading-relaxed text-lg">
            {transcript.map((line, lineIndex) => (
                line.text.split(/(\s+)/).map((word, wordIndex) => {
                    if (!word.trim()) {
                        // This preserves spaces between words, giving a more natural flow.
                        return <span key={`${line.offset}-${lineIndex}-space-${wordIndex}`}>{word}</span>;
                    }
                    
                    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                    const isSaved = savedWords.has(cleanedWord);
                    const key = `${line.offset}-${lineIndex}-${wordIndex}`;

                    return (
                        <Button 
                            key={key}
                            variant="ghost" 
                            size="sm" 
                            className={cn(
                                "h-auto px-1 py-0.5 font-medium text-base hover:bg-primary/10 text-foreground",
                                isSaved && "bg-destructive/10 text-destructive-foreground hover:bg-destructive/20"
                            )}
                            onClick={() => addVocabularyItem(cleanedWord, videoId)}
                        >
                            {word}
                        </Button>
                    )
                })
            ))}
        </div>
    </ScrollArea>
  );
}
