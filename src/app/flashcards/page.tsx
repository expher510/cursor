'use client';
import { AppHeader } from "@/components/app-header";
import { FlashcardGrid } from "@/components/flashcard-grid";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FlashcardsPage() {
  const router = useRouter();

  return (
    <>
      <AppHeader />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Flashcards</h1>
            <p className="text-muted-foreground max-w-2xl">
                Review all the words you've saved from different videos. Click on a card to flip it and reveal the translation.
            </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
        </Button>
        <FlashcardGrid />
      </main>
    </>
  );
}
