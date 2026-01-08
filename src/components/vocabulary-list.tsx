'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { X, List, Search, BrainCircuit, Copy } from "lucide-react";
import { useFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, doc, query } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { useState, useMemo } from "react";
import { useWatchPage } from "@/context/watch-page-context";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
  userId: string;
  videoId: string;
};

export function VocabularyList({ isSheet = false }: { isSheet?: boolean }) {
  const { firestore, user } = useFirebase();
  const { vocabulary, removeVocabularyItem } = useWatchPage();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVocabulary = useMemo(() => {
    if (!vocabulary) return [];
    return vocabulary.filter(item => 
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.translation && item.translation.toLowerCase().includes(searchTerm.toLowerCase()))
    );
}, [vocabulary, searchTerm]);


  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/vocabularies`));
  }, [user, firestore]);

  const { isLoading } = useCollection<VocabularyItem>(vocabQuery);


  const content = (
    <>
      <div className="p-4">
         <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Filter vocabulary..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>
        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
             <div className="space-y-2">
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
            </div>
          ) : !filteredVocabulary || filteredVocabulary.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed text-center p-4">
                <p className="text-sm font-medium text-muted-foreground">
                    {searchTerm ? "No results found" : "Your vocabulary list is empty."}
                </p>
                <p className="text-xs text-muted-foreground">
                    {searchTerm ? "Try a different search term." : "Click on words in the transcript to add them."}
                </p>
            </div>
          ) : (
             <TooltipProvider>
                <ul className="space-y-2 pb-4">
                  {filteredVocabulary.map((item) => (
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
    </>
  )

  if (isSheet) {
    return content;
  }

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <List />
              <CardTitle>Vocabulary</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {content}
        </CardContent>
    </Card>
  );
}
