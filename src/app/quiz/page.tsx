'use client';
import { AppHeader } from "@/components/app-header";

export default function QuizPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto mt-24 flex flex-col items-center gap-6">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Quiz Page</h1>
            <p className="text-muted-foreground">This is a placeholder for the quiz feature.</p>
        </div>
      </main>
    </>
  );
}
