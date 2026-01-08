'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useFirebase } from "@/firebase";
import { Skeleton } from "./ui/skeleton";
import { useWatchPage } from "@/context/watch-page-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export function VocabularyList() {
  const { vocabulary, removeVocabularyItem, isLoading } = useWatchPage();
  
  return (
    <div className="flex flex-col h-full rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-4 border-b">
             <h2 className="text-lg font-semibold tracking-tight">Vocabulary</h2>
             <p className="text-sm text-muted-foreground">Words you save will appear here.</p>
        </div>
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
             <div className="space-y-2">
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
            </div>
          ) : !vocabulary || vocabulary.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-md border border-dashed text-center p-4">
                <p className="text-sm text-muted-foreground">
                    Click on words in the transcript to add them.
                </p>
            </div>
          ) : (
             <TooltipProvider>
                <ul className="space-y-2">
                  {vocabulary.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                      <div>
                        <p className="font-semibold capitalize text-primary">{item.word}</p>
                        <p className="text-sm text-muted-foreground">{item.translation}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeVocabularyItem(item.id)}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove</p>
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
            </TooltipProvider>
          )}
        </ScrollArea>
    </div>
  );
}
