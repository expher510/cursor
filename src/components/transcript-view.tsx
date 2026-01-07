"use client";

import { useState } from "react";
import { type TranscriptItem } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpenText } from "lucide-react";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  translations: Record<string, string>;
  onAddToVocabulary: (word: string, translation: string) => void;
};

export function TranscriptView({ transcript, translations, onAddToVocabulary }: TranscriptViewProps) {
  const [translatedWords, setTranslatedWords] = useState<Set<string>>(new Set());

  const toggleTranslation = (key: string) => {
    setTranslatedWords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleWordDoubleClick = (word: string) => {
    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    const translation = translations[cleanedWord];
    if (translation) {
      onAddToVocabulary(word, translation);
    }
  };

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
          <div className="space-y-6">
            {transcript.map((item, lineIndex) => (
              <div key={lineIndex} className="flex gap-4">
                <span className="font-mono text-sm text-muted-foreground pt-1">{item.timestamp}</span>
                <p className="text-lg leading-relaxed">
                  {item.text.split(" ").map((word, wordIndex) => {
                    const key = `${lineIndex}-${wordIndex}`;
                    const cleanedWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                    const translation = translations[cleanedWord];
                    const isTranslated = translatedWords.has(key);

                    if (translation) {
                      return (
                        <span key={wordIndex} className="relative">
                          <span
                            onClick={() => toggleTranslation(key)}
                            onDoubleClick={() => handleWordDoubleClick(word)}
                            className="cursor-pointer font-medium text-primary hover:bg-primary/10 rounded-md px-1 py-0.5 transition-colors"
                          >
                            {isTranslated ? translation : word}
                          </span>{' '}
                        </span>
                      );
                    }
                    return <span key={wordIndex}>{word} </span>;
                  })}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
