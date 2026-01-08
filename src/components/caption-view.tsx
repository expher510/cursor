"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";

type CaptionViewProps = {
  transcript: TranscriptItem[];
  currentTime: number; // in milliseconds
};

export function CaptionView({ transcript, currentTime }: CaptionViewProps) {
  const currentLine = useMemo(() => {
    if (!transcript || transcript.length === 0) {
      return null;
    }
    return transcript.find(line => 
      currentTime >= line.offset && currentTime < (line.offset + line.duration)
    );
  }, [transcript, currentTime]);

  return (
    <div className="w-full bg-black/75 rounded-lg p-4 min-h-[80px] flex items-center justify-center text-center">
      {transcript.length > 0 ? (
        <p className="text-xl font-semibold text-white leading-relaxed">
          {currentLine ? currentLine.text : "..."}
        </p>
      ) : (
        <Skeleton className="h-8 w-3/4 bg-gray-600" />
      )}
    </div>
  );
}
