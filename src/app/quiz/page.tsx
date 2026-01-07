'use client';
import { Suspense } from 'react';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function QuizGenerator() {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Video Comprehension Quiz</CardTitle>
                <CardDescription>
                    This feature is coming soon!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>No quiz available.</p>
            </CardContent>
        </Card>
    );
}


export default function QuizPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
            <QuizGenerator />
        </Suspense>
      </main>
    </>
  );
}
