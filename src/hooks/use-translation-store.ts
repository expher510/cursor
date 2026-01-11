
'use client';
import { translateWord } from "@/ai/flows/translate-word-flow";
import { translateSentence } from "@/ai/flows/translate-sentence-flow";
import { create } from "zustand";

type WordTranslation = {
    originalText: string;
    translatedText: string;
};

type TranslationState = {
  wordTranslations: Record<string, WordTranslation>;
  isTranslatingWord: Record<string, boolean>;
  toggleWordTranslation: (word: string, originalText: string, context: string, key: string, nativeLanguage: string, sourceLang: string) => void;

  sentenceTranslations: Record<number, string>;
  isTranslatingSentence: Record<number, boolean>;
  toggleSentenceTranslation: (lineIndex: number, sentence: string, nativeLanguage: string, sourceLang: string) => void;
};

export const useTranslationStore = create<TranslationState>((set, get) => ({
  wordTranslations: {},
  isTranslatingWord: {},
  sentenceTranslations: {},
  isTranslatingSentence: {},

  toggleWordTranslation: async (word, originalText, context, key, nativeLanguage, sourceLang) => {
    const { wordTranslations, isTranslatingWord } = get();

    if (wordTranslations[key]) {
      const newTranslations = { ...wordTranslations };
      delete newTranslations[key];
      set({ wordTranslations: newTranslations });
      return;
    }

    if (isTranslatingWord[key]) {
      return;
    }

    set(state => ({ isTranslatingWord: { ...state.isTranslatingWord, [key]: true } }));

    try {
        const { translation } = await translateWord({ 
            word: word, 
            sourceLang: sourceLang, 
            nativeLanguage: nativeLanguage,
            context: context,
        });
        
        set(state => ({
            wordTranslations: {
                ...state.wordTranslations,
                [key]: {
                    originalText: originalText,
                    translatedText: translation
                }
            },
            isTranslatingWord: { ...state.isTranslatingWord, [key]: false }
        }));
    } catch (error) {
      console.error("Word translation failed:", error);
      set(state => ({ isTranslatingWord: { ...state.isTranslatingWord, [key]: false } }));
    }
  },

  toggleSentenceTranslation: async (lineIndex, sentence, nativeLanguage, sourceLang) => {
    const { sentenceTranslations, isTranslatingSentence } = get();

    if (sentenceTranslations[lineIndex]) {
        const newTranslations = { ...sentenceTranslations };
        delete newTranslations[lineIndex];
        set({ sentenceTranslations: newTranslations });
        return;
    }

    if (isTranslatingSentence[lineIndex]) {
        return;
    }
    
    set(state => ({ isTranslatingSentence: { ...state.isTranslatingSentence, [lineIndex]: true } }));
    
    try {
        const { translation } = await translateSentence({
            sentence: sentence,
            sourceLang: sourceLang,
            nativeLanguage: nativeLanguage
        });

        set(state => ({
            sentenceTranslations: {
                ...state.sentenceTranslations,
                [lineIndex]: translation
            },
            isTranslatingSentence: { ...state.isTranslatingSentence, [lineIndex]: false }
        }));

    } catch (error) {
        console.error("Sentence translation failed:", error);
        set(state => ({ isTranslatingSentence: { ...state.isTranslatingSentence, [lineIndex]: false } }));
    }
  }
}));
