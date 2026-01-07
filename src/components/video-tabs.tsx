"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { TranscriptView } from "./transcript-view"
import { VocabularyList } from "./vocabulary-list"
import { type TranscriptItem } from "@/ai/flows/process-video-flow"
import { BookOpenText, List, Eye, BrainCircuit } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "./ui/button"
import { useState } from "react"
import Link from "next/link"

type VideoTabsProps = {
  transcript: TranscriptItem[];
  videoId: string;
};


export function VideoTabs({ transcript, videoId }: VideoTabsProps) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);

  return (
    <Tabs defaultValue="transcript" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="transcript"><BookOpenText className="h-4 w-4 mr-2"/>Transcript</TabsTrigger>
          <TabsTrigger value="vocabulary"><List className="h-4 w-4 mr-2"/>Vocabulary</TabsTrigger>
        </TabsList>
        <Button asChild>
            <Link href={`/quiz?v=${videoId}`}>
                <BrainCircuit className="mr-2 h-4 w-4" />
                Start Quiz
            </Link>
        </Button>
      </div>
      <TabsContent value="transcript">
        <Collapsible open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpenText />
                            Transcript
                        </CardTitle>
                        <CardDescription>
                            Click a word to add it to your vocabulary list.
                        </CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Toggle transcript visibility</span>
                        </Button>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent>
                        <TranscriptView transcript={transcript} videoId={videoId} />
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
      </TabsContent>
      <TabsContent value="vocabulary">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <List />
                    Vocabulary
                </CardTitle>
            </CardHeader>
            <CardContent>
                <VocabularyList />
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
