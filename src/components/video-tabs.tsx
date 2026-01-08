"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <Tabs defaultValue="reading" className="w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <TabsList>
          <TabsTrigger value="reading" className="gap-2"><BookOpenText/> Reading</TabsTrigger>
          <TabsTrigger value="vocabulary" className="gap-2"><List/> Vocabulary</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="reading">
         <div className="p-1 rounded-lg border bg-card text-card-foreground shadow-sm">
            <TranscriptView transcript={transcript} videoId={videoId} />
        </div>
      </TabsContent>
      <TabsContent value="vocabulary">
          <VocabularyList />
      </TabsContent>
    </Tabs>
  )
}
