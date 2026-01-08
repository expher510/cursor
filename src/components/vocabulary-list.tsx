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
import React, { useRef, useState } from "react";

type VocabularyListProps = {
  layout?: 'grid' | 'scroll';
};

export function VocabularyList({ layout = 'scroll' }: VocabularyListProps) {
  const { vocabulary, removeVocabularyItem, isLoading } = useWatchPage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (layout !== 'scroll' || !scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    if (layout !== 'scroll' || !isDragging || !scrollRef.current) return;
    setIsDragging(false);
    scrollRef.current.style.cursor = 'grab';
  };

  const handleMouseUp = () => {
    if (layout !== 'scroll' || !isDragging || !scrollRef.current) return;
    setIsDragging(false);
    scrollRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (layout !== 'scroll' || !isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const renderItem = (item: { id: string; word: string; translation: string; }) => (
    <div
      key={item.id}
      className="group relative flex items-center gap-2 rounded-full border border-primary bg-secondary/50 pr-2 pl-4 py-1 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary"
    >
      <div className="flex flex-col text-left pointer-events-none">
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
  );

  return (
    <div className="flex h-full rounded-lg border bg-card text-card-foreground shadow-sm flex-1 p-4">
      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      ) : !vocabulary || vocabulary.length === 0 ? (
        <div className="flex w-full h-full min-h-[60px] items-center justify-center rounded-md text-center">
          <p className="text-sm text-muted-foreground">Words you save will appear here.</p>
        </div>
      ) : (
        <TooltipProvider>
          {layout === 'scroll' ? (
            <div
              className="w-full overflow-x-auto cursor-grab"
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex w-max space-x-3 pb-2 select-none">
                {vocabulary.map(renderItem)}
              </div>
            </div>
          ) : (
             <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                 {vocabulary.map(renderItem)}
             </div>
          )}
        </TooltipProvider>
      )}
    </div>
  );
}
