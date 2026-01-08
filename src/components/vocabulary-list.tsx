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


export function VocabularyList() {
  const { vocabulary, removeVocabularyItem, isLoading } = useWatchPage();
  
  return (
    <div className="flex flex-col h-full rounded-lg border bg-card text-card-foreground shadow-sm flex-1 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {isLoading ? (
               <div className="flex flex-wrap gap-2">
                 <Skeleton className="h-10 w-24 rounded-full" />
                 <Skeleton className="h-10 w-32 rounded-full" />
                 <Skeleton className="h-10 w-28 rounded-full" />
              </div>
            ) : !vocabulary || vocabulary.length === 0 ? (
              <div className="flex h-full min-h-[100px] items-center justify-center rounded-md text-center p-4">
                  <p className="text-sm text-muted-foreground">
                      Words you save will appear here.
                  </p>
              </div>
            ) : (
               <TooltipProvider>
                  <div className="flex flex-wrap gap-3">
                    {vocabulary.map((item) => (
                      <div 
                        key={item.id} 
                        className="group relative flex items-center gap-2 rounded-full border border-primary bg-secondary/50 pr-2 pl-4 py-1 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary"
                      >
                        <div className="flex flex-col">
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
            )}
          </div>
           {vocabulary && vocabulary.length > 0 && (
                <Button asChild variant="default">
                    <Link href="/flashcards">
                        <Copy className="h-5 w-5" />
                        <span className="hidden sm:inline">Flashcards</span>
                    </Link>
                </Button>
            )}
        </div>
    </div>
  );
}
