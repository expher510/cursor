
'use client';
import { AppHeader } from "@/components/app-header";

export default function ReadingPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Reading Practice</h1>
            <p className="text-muted-foreground max-w-2xl">
                Select a text to start practicing your reading skills.
            </p>
        </div>
        {/* Content for reading exercises will go here */}
        <div className="text-center p-8 border-dashed border-2 rounded-lg">
            <p className="text-muted-foreground">Reading exercises coming soon!</p>
        </div>
      </main>
    </>
  );
}
