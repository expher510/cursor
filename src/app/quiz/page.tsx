'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { useRouter } from "next/navigation";

export default function QuizPage() {
  const router = useRouter();

  return (
    <>
      <AppHeader>
        <Button variant="ghost" onClick={() => router.back()} className="ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      </AppHeader>
      <main className="container mx-auto mt-24 flex flex-col items-center gap-6">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Quiz Page</h1>
            <p className="text-muted-foreground">This is a placeholder for the quiz feature.</p>
        </div>
      </main>
    </>
  );
}
