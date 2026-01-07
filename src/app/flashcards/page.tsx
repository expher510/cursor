'use client';
import { AppHeader } from "@/components/app-header";
import { FlashcardGrid } from "@/components/flashcard-grid";

export default function FlashcardsPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Flashcards</h1>
            <p className="text-muted-foreground max-w-2xl">
                Review all the words you've saved from different videos. Click on a card to flip it and reveal the translation.
            </p>
        </div>
        <FlashcardGrid />
      </main>
    </>
  );
}
