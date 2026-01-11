
'use client';
import { translateWord } from "@/ai/flows/translate-word-flow";
import { create } from "zustand";

type Translation = {
    originalText: string;
    translatedText: string;
};

type TranslationState = {
  translations: Record<string, Translation>;
  isTranslating: Record<string, boolean>;
  toggleTranslation: (word: string, originalText: string, context: string, key: string, nativeLanguage: string, sourceLang: string) => void;
};

export const useTranslationStore = create<TranslationState>((set, get) => ({
  translations: {},
  isTranslating: {},

  toggleTranslation: async (word, originalText, context, key, nativeLanguage, sourceLang) => {
    const { translations, isTranslating } = get();

    // If it's already translated, revert it
    if (translations[key]) {
      const newTranslations = { ...translations };
      delete newTranslations[key];
      set({ translations: newTranslations });
      return;
    }

    // If a request is already in flight, do nothing
    if (isTranslating[key]) {
      return;
    }

    // Mark as translating
    set(state => ({ isTranslating: { ...state.isTranslating, [key]: true } }));

    try {
        const { translation } = await translateWord({ 
            word: word, 
            sourceLang: sourceLang, 
            nativeLanguage: nativeLanguage,
            context: context,
        });
        
        set(state => ({
            translations: {
                ...state.translations,
                [key]: {
                    originalText: originalText,
                    translatedText: translation
                }
            },
            isTranslating: { ...state.isTranslating, [key]: false }
        }));
    } catch (error) {
      console.error("Translation failed:", error);
      set(state => ({ isTranslating: { ...state.isTranslating, [key]: false } }));
    }
  },
}));
