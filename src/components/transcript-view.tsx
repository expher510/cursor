"use client";

import { useDraggable } from "@dnd-kit/core";
import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  translations: Record<string, string>;
  videoId: string;
};

function DraggableWord({ word, translation, lineIndex, wordIndex, videoId }: { word: string; translation: string; lineIndex: number; wordIndex: number; videoId: string; }) {
  const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-${lineIndex}-${wordIndex}`,
    data: {
      word: cleanedWord,
      translation: translation,
      videoId: videoId,
    },
  });

  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab font-medium text-primary hover:bg-primary/10 rounded-md px-1 py-0.5 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      {word}
    </span>
  );
}


export function TranscriptView({ transcript, translations, videoId }: TranscriptViewProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <BookOpenText className="h-6 w-6" />
          Transcript
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {transcript.map((item, lineIndex) => (
              <p key={lineIndex} className="text-lg leading-relaxed">
                {item.text.split(" ").map((word, wordIndex) => {
                  const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                  const translation = translations[cleanedWord] || "";
                  
                  return (
                    <span key={wordIndex}>
                      <DraggableWord
                        word={word}
                        translation={translation}
                        lineIndex={lineIndex}
                        wordIndex={wordIndex}
                        videoId={videoId}
                      />
                      {' '}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
