'use client';

import { YoutubeUrlForm } from "@/components/youtube-url-form";
import { Logo } from "@/components/logo";
import { AppHeader } from "@/components/app-header";
import { VideoHistory } from "@/components/video-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Edit } from "lucide-react";
import Link from "next/link";

function PracticeExercises() {
  return (
    <div className="w-full max-w-4xl pt-10 text-left">
      <h2 className="text-2xl font-bold font-headline mb-6">Practice Your Skills</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BookOpen className="text-primary" />
              <span>Reading Practice</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Improve your reading comprehension by reviewing video transcripts and other texts.
            </p>
            <Button asChild>
              <Link href="/reading">Start Reading <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Edit className="text-primary" />
              <span>Writing Practice</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Test your vocabulary by constructing sentences using the words you've learned.
            </p>
            <Button asChild>
              <Link href="/writing">Start Writing <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function Home() {
  return (
    <>
      <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 pt-24">
        <div className="flex flex-col items-center gap-8 text-center max-w-4xl w-full">
          <Logo />
          <div className="flex flex-col gap-2">
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Unlock Languages with YouTube
            </h1>
            <p className="text-muted-foreground md:text-xl">
              Paste a YouTube URL to begin your interactive language learning journey. Turn any video into a lesson.
            </p>
          </div>
          <div className="w-full max-w-lg">
            <YoutubeUrlForm />
          </div>
          <PracticeExercises />
          <VideoHistory />
        </div>
      </main>
    </>
  );
}
