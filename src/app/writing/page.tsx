
'use client';
import { AppHeader } from "@/components/app-header";

export default function WritingPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Writing Practice</h1>
            <p className="text-muted-foreground max-w-2xl">
                Configure your writing exercise.
            </p>
        </div>
         {/* Content for writing exercises will go here */}
         <div className="text-center p-8 border-dashed border-2 rounded-lg">
            <p className="text-muted-foreground">Writing exercises coming soon!</p>
        </div>
      </main>
    </>
  );
}
