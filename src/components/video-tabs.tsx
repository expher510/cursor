"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { TranscriptView } from "./transcript-view"
import { VocabularyList } from "./vocabulary-list"
import { type TranscriptItem } from "@/ai/flows/process-video-flow"
import { BookOpenText, List, BrainCircuit, Eye } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from "react"


type VideoTabsProps = {
  transcript: TranscriptItem[];
  videoId: string;
};


export function VideoTabs({ transcript, videoId }: VideoTabsProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen} className="w-full">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpenText />
                            Transcript
                        </CardTitle>
                        <CardDescription>
                            Click a word to add it to your vocabulary list.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild>
                            <Link href={`/quiz?v=${videoId}`}>
                                <BrainCircuit className="mr-2 h-4 w-4" />
                                Start Quiz
                            </Link>
                        </Button>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Toggle transcript visibility</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent>
                        <TranscriptView transcript={transcript} videoId={videoId} />
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
      </div>
      <div>
        <VocabularyList />
      </div>
    </div>
  )
}
