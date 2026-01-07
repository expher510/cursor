"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { TranscriptView } from "./transcript-view"
import { VocabularyList } from "./vocabulary-list"
import { type TranscriptItem } from "@/ai/flows/process-video-flow"
import { BookOpenText, List } from "lucide-react"

type ReadingTabsProps = {
  transcript: TranscriptItem[];
  videoId: string;
};


export function ReadingTabs({ transcript, videoId }: ReadingTabsProps) {
  return (
    <Tabs defaultValue="transcript" className="w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <TabsList>
          <TabsTrigger value="transcript" className="gap-2"><BookOpenText/> Transcript</TabsTrigger>
          <TabsTrigger value="vocabulary" className="gap-2"><List/> Vocabulary</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="transcript">
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>
              Click a word to add it to your vocabulary list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TranscriptView transcript={transcript} videoId={videoId} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="vocabulary">
          <VocabularyList />
      </TabsContent>
    </Tabs>
  )
}
