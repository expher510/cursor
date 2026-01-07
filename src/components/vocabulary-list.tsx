import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { X, List } from "lucide-react";

type VocabularyItem = {
  id: string;
  word: string;
  translation: string;
};

type VocabularyListProps = {
  vocabulary: VocabularyItem[];
  onRemove: (id: string) => void;
};

export function VocabularyList({ vocabulary, onRemove }: VocabularyListProps) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <List className="h-6 w-6" />
          Vocabulary
        </CardTitle>
        <CardDescription>Double-click a word in the transcript to add it here.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-250px)] pr-4">
          {vocabulary.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">Your saved words will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {vocabulary.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border bg-secondary/50 p-3">
                  <div>
                    <p className="font-semibold capitalize text-primary">{item.word}</p>
                    <p className="text-sm text-muted-foreground">{item.translation}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onRemove(item.id)}>
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
