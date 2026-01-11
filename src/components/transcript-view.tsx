
"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { Button } from "./ui/button";
import { useWatchPage } from "@/context/watch-page-context";
import { cn } from "@/lib/utils";
import { useTranslationStore } from "@/hooks/use-translation-store";
import { useMemo, useRef } from "react";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Languages, Loader2, Dot } from "lucide-react";

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
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const fullText = useMemo(() => transcript.map(line => line.text).join(' '), [transcript]);
  const isRtl = useMemo(() => /[\u0600-\u06FF]/.test(fullText), [fullText]);

  const handlePointerDown = (lineIndex: number, lineText: string) => {
    if (!isLongPressEnabled || !userProfile || !videoData) return;
    pressTimer.current = setTimeout(() => {
      toggleSentenceTranslation(lineIndex, lineText, userProfile.nativeLanguage, videoData.sourceLang);
    }, 500); // 500ms for long press
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleWordClick = (e: React.MouseEvent, word: string, originalText: string, context: string, key: string, lineIndex: number) => {
    // If a long press is happening, don't trigger word translation
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    // Prevents line play if enabled
    e.stopPropagation();

    const isSaved = savedWordsSet.has(word);
    
    // Always allow translation toggle, but only add to vocab if not saved
    if (!isSaved) {
      addVocabularyItem(word, context);
    }
    
    if (userProfile && videoData) {
      toggleWordTranslation(word, originalText, context, key, userProfile.nativeLanguage, videoData.sourceLang);
    }
  };
  
  const handleLineClick = (e: React.MouseEvent, offset: number, duration: number, text: string, lineIndex: number) => {
    if (onPlaySegment) {
       // Check if the click was on a word button; if so, the word handler already stopped propagation.
       // This check ensures clicks on the line padding still work.
       if (e.target === e.currentTarget) {
          onPlaySegment(offset, duration, text);
       }
    }
  };

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
                  )}
                  onClick={(e) => handleLineClick(e, line.offset, line.duration, line.text, lineIndex)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp} // Also clear timer if pointer leaves
                >
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-transparent rounded-l-md transition-all", isActive && "bg-primary")} />
                    
                     <div className="pt-2.5 pl-1">
                        <Dot className={cn("h-6 w-6 text-muted-foreground/30", (translatedSentence || isSentenceCurrentlyTranslating) && "text-primary")} />
                    </div>
                    
                    <p className="flex-1 py-2 pl-1 pr-2" onPointerUp={handlePointerUp}>
                         {isSentenceCurrentlyTranslating ? (
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                Translating sentence...
                            </span>
                         ) : translatedSentence ? (
                            <span className="text-blue-900" onPointerDown={() => handlePointerDown(lineIndex, line.text)}>{translatedSentence}</span>
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
                                    <span key={key} className="inline-block relative group/word" onPointerDown={() => handlePointerDown(lineIndex, line.text)}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                            "h-auto px-1 py-0.5 font-medium text-lg hover:bg-primary/10 text-foreground align-baseline",
                                            isSaved && !translation && "bg-amber-100 text-amber-900 cursor-help",
                                            translation && "bg-blue-100 text-blue-900"
                                            )}
                                            disabled={isCurrentlyTranslating || !cleanedWord}
                                            onClick={(e) => handleWordClick(e, cleanedWord, originalText, line.text, key, lineIndex)}
                                        >
                                            {isCurrentlyTranslating ? '...' : displayedText}
                                        </Button>
                                    </span>
                                );
                            })
                         )}
                    </p>
                </div>
            )
        })}
    </div>
  );
}
