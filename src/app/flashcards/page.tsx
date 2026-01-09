'use client';
import { AppHeader } from "@/components/app-header";
import { FlashcardGrid } from "@/components/flashcard-grid";
import { Logo } from "@/components/logo";

export default function FlashcardsPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <div className="text-center flex flex-col items-center gap-4">
            <Logo />
            <p className="text-muted-foreground max-w-2xl">
                Review all the words you've saved. These words will be highlighted for you across the app for easier learning. Click a card to flip it.
            </p>
        </div>
        <FlashcardGrid />
      </main>
    </>
  );
}
