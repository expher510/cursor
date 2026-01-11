
"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";
import { cn } from "@/lib/utils";
import { useTranslationStore } from "@/hooks/use-translation-store";
import { useMemo } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useUserProfile } from "@/hooks/use-user-profile";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  videoId: string;
  onPlaySegment?: ((offset: number, duration: number, text: string) => void) | null;
  activeSegmentIndex?: number;
};


export function TranscriptView({ transcript, videoId, onPlaySegment, activeSegmentIndex = -1 }: TranscriptViewProps) {
  const { addVocabularyItem, savedWordsSet, videoData } = useWatchPage();
  const { translations, toggleTranslation, isTranslating } = useTranslationStore();
  const { userProfile } = useUserProfile();

  const fullText = useMemo(() => transcript.map(line => line.text).join(' '), [transcript]);
  const isRtl = useMemo(() => /[\u0600-\u06FF]/.test(fullText), [fullText]);

  const handleWordClick = (word: string, originalText: string, context: string, key: string) => {
    const isSaved = savedWordsSet.has(word);
    
    if (!isSaved) {
        addVocabularyItem(word, context);
    }

    if (userProfile && videoData) {
      toggleTranslation(word, originalText, context, key, userProfile.targetLanguage, videoData.sourceLang);
    }
  };
  
  return (
    <div className={cn("p-4 leading-relaxed text-lg space-y-2", isRtl && "text-right")} dir={isRtl ? "rtl" : "ltr"}>
        {transcript.map((line, lineIndex) => {
            const isActive = lineIndex === activeSegmentIndex;
            const isNext = lineIndex === activeSegmentIndex + 1;
            
            return (
                <div 
                  key={line.offset} 
                  className={cn(
                    "flex items-start gap-3 rounded-md transition-colors relative",
                    onPlaySegment && "cursor-pointer",
                    isActive ? "bg-primary/10" : "hover:bg-muted/50",
                    isNext && "bg-muted/70"
                  )}
                  onClick={() => onPlaySegment && onPlaySegment(line.offset, line.duration, line.text)}
                >
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 bg-transparent rounded-l-md transition-all",
                        isActive && "bg-primary"
                    )} />
                    <p className="flex-1 py-2 pl-4 pr-2">
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
                                <span key={key} className="inline-block relative group/word" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                    "h-auto px-1 py-0.5 font-medium text-lg hover:bg-primary/10 text-foreground align-baseline",
                                    isSaved && !translation && "bg-amber-100 text-amber-900 cursor-help",
                                    translation && "bg-blue-100 text-blue-900"
                                    )}
                                    onClick={() => handleWordClick(cleanedWord, originalText, line.text, key)}
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
