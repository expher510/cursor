"use client";

import { useMemo } from "react";
import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  videoId: string;
};

export function TranscriptView({ transcript, videoId }: TranscriptViewProps) {
    const { addVocabularyItem } = useWatchPage();

  return (
    <ScrollArea className="h-[400px] md:h-auto md:flex-1">
        <div className="p-1 leading-relaxed text-lg">
            {transcript.map((line) => line.text.split(' ').map((word, wordIndex) => {
                const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                const key = `${line.offset}-${wordIndex}`;
                return (
                    <Button 
                        key={key}
                        variant="ghost" 
                        size="sm" 
                        className="h-auto px-1 py-0.5 font-medium text-base hover:bg-primary/10 text-foreground"
                        onClick={() => addVocabularyItem(cleanedWord, videoId)}
                    >
                        {word}
                    </Button>
                )
            }))}
        </div>
    </ScrollArea>
  );
}
