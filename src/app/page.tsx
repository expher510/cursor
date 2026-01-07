'use client';

import { YoutubeUrlForm } from "@/components/youtube-url-form";
import { Logo } from "@/components/logo";
import { VideoHistory } from "@/components/video-history";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Edit, Headphones } from "lucide-react";
import Link from "next/link";

function ActivityCards() {
  return (
    <div className="w-full max-w-5xl pt-10 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="hover:shadow-lg transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Headphones className="text-primary" />
              <span>Listening Practice</span>
            </CardTitle>
             <CardDescription>
              Turn any video into an interactive lesson.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-center">
             <YoutubeUrlForm />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BookOpen className="text-primary" />
              <span>Reading Practice</span>
            </CardTitle>
             <CardDescription>
              Improve comprehension by reviewing transcripts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end">
            <Button asChild>
              <Link href="/reading">Start Reading <ArrowRight className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Edit className="text-primary" />
              <span>Writing Practice</span>
            </CardTitle>
             <CardDescription>
              Construct sentences with your vocabulary.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end">
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
        <div className="flex flex-col items-center gap-8 text-center max-w-5xl w-full">
          <Logo />
          <div className="flex flex-col gap-2">
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Unlock Languages with Video
            </h1>
            <p className="text-muted-foreground md:text-xl max-w-2xl">
              Choose an activity below to begin your interactive language learning journey.
            </p>
          </div>
          <ActivityCards />
          <VideoHistory />
        </div>
      </main>
    </>
  );
}
