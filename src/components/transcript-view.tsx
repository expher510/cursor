
"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";
import { cn } from "@/lib/utils";
import { useTranslationStore } from "@/hooks/use-translation-store";
import { useMemo } from "react";
import { Play, Pause } from "lucide-react";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  videoId: string;
  onPlaySegment?: (offset: number, duration: number, segmentId: string) => void;
  activeSegmentId?: string | null;
  isPlaying?: boolean;
};


export function TranscriptView({ transcript, videoId, onPlaySegment, activeSegmentId, isPlaying }: TranscriptViewProps) {
  const { addVocabularyItem, savedWordsSet } = useWatchPage();
  const { translations, toggleTranslation, isTranslating } = useTranslationStore();

  const fullText = useMemo(() => transcript.map(line => line.text).join(' '), [transcript]);
  const isRtl = useMemo(() => /[\u0600-\u06FF]/.test(fullText), [fullText]);

  const handleWordClick = (word: string, originalText: string, key: string) => {
    const isSaved = savedWordsSet.has(word);
    
    if (!isSaved) {
        addVocabularyItem(word);
    }

    toggleTranslation(word, originalText, key);
  };
  
  return (
    <div className={cn("p-4 leading-relaxed text-lg space-y-4", isRtl && "text-right")} dir={isRtl ? "rtl" : "ltr"}>
        {transcript.map((line, lineIndex) => {
            const segmentId = `${videoId}-${lineIndex}`;
            const isActive = activeSegmentId === segmentId;

            return (
                <div key={line.offset} className="flex items-start gap-3">
                    {onPlaySegment && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 mt-1 text-muted-foreground hover:text-primary"
                            onClick={() => onPlaySegment(line.offset, line.duration, segmentId)}
                        >
                            {isActive && isPlaying ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5" />}
                        </Button>
                    )}
                    <p className="flex-1">
                        {line.text.split(/(\s+)/).map((word, wordIndex) => {
                            const originalText = word;
                            const key = `${lineIndex}-${wordIndex}`;
                            
                            if (!word.trim()) {
                            return <span key={`${key}-space`}>{word}</span>;
                            }
                            
                            const cleanedWord = word
                            .toLowerCase()
                            .replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");

                            const isSaved = savedWordsSet.has(cleanedWord);
                            const translation = translations[key];
                            const displayedText = translation ? translation.translatedText : originalText;
                            const isCurrentlyTranslating = isTranslating[key];

                            return (
                                <span key={key} className="inline-block relative group/word">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                    "h-auto px-1 py-0.5 font-medium text-lg hover:bg-primary/10 text-foreground align-baseline",
                                    isSaved && !translation && "bg-amber-100 text-amber-900 cursor-help",
                                    translation && "bg-blue-100 text-blue-900"
                                    )}
                                    onClick={() => handleWordClick(cleanedWord, originalText, key)}
                                    disabled={isCurrentlyTranslating || !cleanedWord}
                                >
                                    {isCurrentlyTranslating ? '...' : displayedText}
                                </Button>
                                </span>
                            );
                        })}
                    </p>
                </div>
            )
        })}
    </div>
  );
}
