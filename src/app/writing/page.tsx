
'use client';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Loader2, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function WritingWorkspace() {
    const { videoData, vocabulary, isLoading: isContextLoading } = useWatchPage();
    const [wordCount, setWordCount] = useState(10);
    const [exerciseWords, setExerciseWords] = useState<string[]>([]);
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [writingContent, setWritingContent] = useState("");
    const [isStarted, setIsStarted] = useState(false);
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    
    const transcriptText = useMemo(() => {
        if (!videoData?.transcript) return [];
        return videoData.transcript.map(t => t.text).join(' ').toLowerCase().match(/\b(\w+)\b/g) || [];
    }, [videoData]);
    
    const startExercise = () => {
        const vocabWords = [...new Set(vocabulary.map(v => v.word))];
        const shuffledVocab = vocabWords.sort(() => 0.5 - Math.random());
        
        let words = shuffledVocab.slice(0, wordCount);
        
        const wordsNeeded = wordCount - words.length;

        if (wordsNeeded > 0) {
            const vocabSet = new Set(words);
            const transcriptWords = Array.from(new Set(transcriptText)).filter(w => !vocabSet.has(w));
            const shuffledTranscript = transcriptWords.sort(() => 0.5 - Math.random());
            
            words = [...words, ...shuffledTranscript.slice(0, wordsNeeded)];
        }

        const finalWords = words.sort(() => 0.5 - Math.random());
        setExerciseWords(finalWords);
        setAvailableWords(finalWords);
        setWritingContent("");
        setIsStarted(true);
    };

    const handleWordClick = (word: string) => {
        setWritingContent(prev => prev ? `${prev} ${word}` : word);
        setAvailableWords(prev => prev.filter(w => w !== word));
    };
    
    const resetExercise = () => {
        setIsStarted(false);
        setWritingContent("");
        setExerciseWords([]);
        setAvailableWords([]);
    }


    const getFeedback = async () => {
        setIsGettingFeedback(true);
        // Placeholder for AI feedback flow
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsGettingFeedback(false);
    };

    if (isContextLoading) {
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
    }

    if (!isStarted) {
        return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Configure Your Writing Exercise</CardTitle>
                    <CardDescription>Choose how many words to practice with. We'll use words from your vocabulary list first, then add random words from the transcript if needed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Label htmlFor="word-count">Number of Words: {wordCount}</Label>
                        <Slider
                            id="word-count"
                            min={5}
                            max={15}
                            step={1}
                            value={[wordCount]}
                            onValueChange={(value) => setWordCount(value[0])}
                        />
                    </div>
                    <Button onClick={startExercise} className="w-full">Start Exercise</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full max-w-4xl space-y-6">
            <Card>
                <CardHeader>
                    <CardDescription>Click a word bubble to use it in your text. It will disappear from the list once used.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[6rem]">
                    <div className="flex flex-wrap gap-3">
                        {availableWords.map(word => (
                             <Badge 
                                key={word}
                                variant="outline"
                                className="cursor-pointer border-primary text-primary text-base font-semibold capitalize transition-all hover:bg-primary/10 px-4 py-2"
                                onClick={() => handleWordClick(word)}
                            >
                                {word}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Textarea
                placeholder="Click words above or type here..."
                rows={10}
                className="text-base"
                value={writingContent}
                onChange={(e) => setWritingContent(e.target.value)}
            />
            
            <div className="flex justify-between">
                <Button variant="outline" onClick={resetExercise}>Back to Settings</Button>
                <Button onClick={getFeedback} disabled={isGettingFeedback || availableWords.length > 0}>
                    {isGettingFeedback ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Get Feedback
                </Button>
            </div>
        </div>
    );
}

export default function WritingPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Writing Practice</h1>
            <p className="text-muted-foreground max-w-2xl">
                Use the selected words to practice your writing skills. When you've used all the words, you can get AI feedback.
            </p>
        </div>
        <WatchPageProvider>
            <WritingWorkspace />
        </WatchPageProvider>
      </main>
    </>
  );
}
