
"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";
import { cn } from "@/lib/utils";
import { useTranslationStore } from "@/hooks/use-translation-store";
import { useMemo, useRef } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Languages, Loader2 } from "lucide-react";

type TranscriptViewProps = {
  transcript: TranscriptItem[];
  videoId: string;
  onPlaySegment?: ((offset: number, duration: number, text: string) => void) | null;
  activeSegmentIndex?: number;
  isLongPressEnabled?: boolean;
};

export function TranscriptView({ transcript, videoId, onPlaySegment, activeSegmentIndex = -1, isLongPressEnabled = false }: TranscriptViewProps) {
  const { addVocabularyItem, savedWordsSet, videoData } = useWatchPage();
  const { 
      wordTranslations, 
      toggleWordTranslation, 
      isTranslatingWord,
      sentenceTranslations,
      toggleSentenceTranslation,
      isTranslatingSentence,
  } = useTranslationStore();
  const { userProfile } = useUserProfile();

  const fullText = useMemo(() => transcript.map(line => line.text).join(' '), [transcript]);
  const isRtl = useMemo(() => /[\u0600-\u06FF]/.test(fullText), [fullText]);

  const handleWordClick = (e: React.MouseEvent, word: string, originalText: string, context: string, key: string) => {
    e.stopPropagation(); 
    const isSaved = savedWordsSet.has(word);
    
    if (!isSaved) {
        addVocabularyItem(word, context);
    }

    if (userProfile && videoData) {
      toggleWordTranslation(word, originalText, context, key, userProfile.nativeLanguage, videoData.sourceLang);
    }
  };

  const handleTranslateSentenceClick = (e: React.MouseEvent, lineIndex: number, lineText: string) => {
    e.stopPropagation();
    if (userProfile && videoData) {
        toggleSentenceTranslation(lineIndex, lineText, userProfile.nativeLanguage, videoData.sourceLang);
    }
  }


  return (
    <div className={cn("p-4 leading-relaxed text-lg space-y-2", isRtl && "text-right")} dir={isRtl ? "rtl" : "ltr"}>
        {transcript.map((line, lineIndex) => {
            const isActive = lineIndex === activeSegmentIndex;
            const isNext = lineIndex === activeSegmentIndex + 1;
            const sentenceKey = lineIndex;
            const translatedSentence = sentenceTranslations[sentenceKey];
            const isSentenceCurrentlyTranslating = isTranslatingSentence[sentenceKey];

            return (
                <div 
                  key={line.offset} 
                  className={cn(
                    "group/line flex items-start gap-2 rounded-md transition-colors relative",
                    onPlaySegment && "cursor-pointer",
                    isActive ? "bg-primary/10" : "hover:bg-muted/50",
                    isNext && "bg-muted/70",
                    translatedSentence && "bg-blue-100/50"
                  )}
                  onClick={() => onPlaySegment && onPlaySegment(line.offset, line.duration, line.text)}
                >
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 bg-transparent rounded-l-md transition-all",
                        isActive && "bg-primary"
                    )} />
                    
                    <p className="flex-1 py-2 pl-4 pr-2">
                         {isSentenceCurrentlyTranslating ? (
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                Translating sentence...
                            </span>
                         ) : translatedSentence ? (
                            <span className="text-blue-900">{translatedSentence}</span>
                         ) : (
                            line.text.split(/(\s+)/).map((word, wordIndex) => {
                                const originalText = word;
                                const key = `${lineIndex}-${wordIndex}`;
                                
                                if (!word.trim()) {
                                return <span key={`${key}-space`}>{word}</span>;
                                }
                                
                                const cleanedWord = word
                                .toLowerCase()
                                .replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");

                                const isSaved = savedWordsSet.has(cleanedWord);
                                const translation = wordTranslations[key];
                                const displayedText = translation ? translation.translatedText : originalText;
                                const isCurrentlyTranslating = isTranslatingWord[key];

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
                                            disabled={isCurrentlyTranslating || !cleanedWord}
                                            onClick={(e) => handleWordClick(e, cleanedWord, originalText, line.text, key)}
                                        >
                                            {isCurrentlyTranslating ? '...' : displayedText}
                                        </Button>
                                    </span>
                                );
                            })
                         )}
                    </p>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 mt-1 mr-1 opacity-20 group-hover/line:opacity-100 transition-opacity"
                        onClick={(e) => handleTranslateSentenceClick(e, lineIndex, line.text)}
                    >
                         {isSentenceCurrentlyTranslating ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Languages className="h-4 w-4" />
                         )}
                        <span className="sr-only">Translate sentence</span>
                    </Button>
                </div>
            )
        })}
    </div>
  );
}
