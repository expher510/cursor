"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { X, List, Droplets } from "lucide-react";
import { useFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "./ui/skeleton";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type VocabularyItem = {
  word: string;
  translation: string;
  userId: string;
  videoId: string;
};

export function VocabularyList() {
  const { firestore, user } = useFirebase();
  const { setNodeRef, isOver } = useDroppable({
    id: 'vocabulary-drop-area',
  });

  const vocabQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/vocabularies`);
  }, [user, firestore]);

  const { data: vocabulary, isLoading } = useCollection<VocabularyItem>(vocabQuery);

  const removeVocabularyItem = (id: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, `users/${user.uid}/vocabularies`, id);
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        "sticky top-0 h-screen border-none shadow-none rounded-none transition-colors",
        isOver && "bg-accent/20"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <List className="h-6 w-6" />
          Vocabulary
        </CardTitle>
        <CardDescription>Drag a word from the transcript to add it here.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-150px)] pr-4">
          {isLoading ? (
             <div className="space-y-2">
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
            </div>
          ) : !vocabulary || vocabulary.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed text-center p-4">
                <Droplets className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Drop Zone</p>
                <p className="text-xs text-muted-foreground">Drag words here to save them.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {vocabulary.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border bg-secondary/50 p-3">
                  <div>
                    <p className="font-semibold capitalize text-primary">{item.word}</p>
                    <p className="text-sm text-muted-foreground">{item.translation}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeVocabularyItem(item.id)}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
