'use client';

import { Button } from "./ui/button";
import { X, Copy } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useWatchPage } from "@/context/watch-page-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";


export function VocabularyList() {
  const { vocabulary, removeVocabularyItem, isLoading } = useWatchPage();
  
  return (
    <div className="flex h-full rounded-lg border bg-card text-card-foreground shadow-sm flex-1 p-4">
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isLoading ? (
               <div className="flex flex-wrap gap-2">
                 <Skeleton className="h-10 w-24 rounded-full" />
                 <Skeleton className="h-10 w-32 rounded-full" />
                 <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            ) : !vocabulary || vocabulary.length === 0 ? (
              <div className="flex h-full min-h-[60px] items-center justify-center rounded-md text-center">
                  <p className="text-sm text-muted-foreground">
                      Words you save will appear here.
                  </p>
              </div>
            ) : (
              <ScrollArea className="w-full whitespace-nowrap">
                <TooltipProvider>
                  <div className="flex w-max space-x-3 pb-2">
                    {vocabulary.map((item) => (
                      <div 
                        key={item.id} 
                        className="group relative flex items-center gap-2 rounded-full border border-primary bg-secondary/50 pr-2 pl-4 py-1 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary"
                      >
                        <div className="flex flex-col text-left">
                          <span className="capitalize">{item.word}</span>
                          <span className="text-xs text-muted-foreground font-normal">{item.translation}</span>
                        </div>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <button 
                               onClick={() => removeVocabularyItem(item.id)}
                               className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-75 transition-all hover:bg-destructive hover:text-destructive-foreground hover:opacity-100"
                             >
                                  <X className="h-3 w-3" />
                                  <span className="sr-only">Remove</span>
                             </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
           {vocabulary && vocabulary.length > 0 && (
                <Button asChild variant="outline" size="icon" className="rounded-full">
                    <Link href="/flashcards">
                        <Copy className="h-5 w-5" />
                        <span className="sr-only">Flashcards</span>
                    </Link>
                </Button>
            )}
        </div>
    </div>
  );
}
