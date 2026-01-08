"use client";

import { type TranscriptItem } from "@/ai/flows/process-video-flow";
import { useMemo } from "react";
import { Skeleton } from "./ui/skeleton";

type CaptionViewProps = {
  transcript: TranscriptItem[];
  currentTime: number; // in milliseconds
};

export function CaptionView({ transcript, currentTime }: CaptionViewProps) {
  const activeLineText = useMemo(() => {
    if (!transcript || transcript.length === 0) {
      return null;
    }

    // Find all lines that are currently active
    const activeLines = transcript.filter(line => 
      currentTime >= line.offset && currentTime < (line.offset + line.duration)
    );

    // If there are active lines, join their text.
    if (activeLines.length > 0) {
      return activeLines.map(line => line.text).join(' ');
    }

    // If no lines are active, find the most recent past line to display.
    // This prevents the screen from going blank during short pauses.
    let lastLine: TranscriptItem | null = null;
    for (const line of transcript) {
        if (line.offset <= currentTime) {
            lastLine = line;
        } else {
            // Since the transcript is sorted, we can break early.
            break;
        }
    }
    
    return lastLine ? lastLine.text : "...";

  }, [transcript, currentTime]);

  return (
    <div className="w-full bg-black/75 rounded-lg p-4 min-h-[80px] flex items-center justify-center text-center">
      {transcript.length > 0 ? (
        <p className="text-xl font-semibold text-white leading-relaxed">
          {activeLineText}
        </p>
      ) : (
        <Skeleton className="h-8 w-3/4 bg-gray-600" />
      )}
    </div>
  );
}
