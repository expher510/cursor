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
    
    // Flatten the transcript into a single array of words for easier rendering
    const words = useMemo(() => {
        return transcript.flatMap((item) => 
            item.text.split(" ").map(word => ({ text: word, originalLine: item.text }))
        );
    }, [transcript]);


  return (
    <ScrollArea className="h-[400px] md:h-auto md:flex-1">
        <div className="p-1">
            {transcript.map((line, lineIndex) => (
                <p key={lineIndex} className="mb-4 leading-relaxed text-lg">
                    {line.text.split(' ').map((word, wordIndex) => {
                        const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                        return (
                            <Button 
                                key={wordIndex}
                                variant="ghost" 
                                size="sm" 
                                className="h-auto px-1 py-0.5 font-medium text-base hover:bg-primary/10 text-foreground"
                                onClick={() => addVocabularyItem(cleanedWord, videoId)}
                            >
                                {word}
                            </Button>
                        )
                    })}
                </p>
            ))}
        </div>
    </ScrollArea>
  );
}
