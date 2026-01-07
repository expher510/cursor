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
import { BookOpenText, List } from "lucide-react"

type VideoTabsProps = {
  transcript: TranscriptItem[];
  videoId: string;
};


export function VideoTabs({ transcript, videoId }: VideoTabsProps) {
  return (
    <Tabs defaultValue="transcript" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="transcript"><BookOpenText className="h-4 w-4 mr-2"/>Transcript</TabsTrigger>
        <TabsTrigger value="vocabulary"><List className="h-4 w-4 mr-2"/>Vocabulary</TabsTrigger>
      </TabsList>
      <TabsContent value="transcript">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpenText />
                    Transcript
                </CardTitle>
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <List />
                    Vocabulary
                </CardTitle>
                 <CardDescription>
                    Your saved words for all videos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <VocabularyList />
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
