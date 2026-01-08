
'use client';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { useWatchPage } from "@/context/watch-page-context";
import { Loader2, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function WritingWorkspace() {
    const { videoData, vocabulary, isLoading: isContextLoading } = useWatchPage();
    const [wordCount, setWordCount] = useState(10);
    const [wordSource, setWordSource] = useState<'vocabulary' | 'transcript'>('vocabulary');
    const [exerciseWords, setExerciseWords] = useState<string[]>([]);
    const [isStarted, setIsStarted] = useState(false);
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    
    const transcriptText = useMemo(() => {
        return videoData?.transcript.map(t => t.text).join(' ').toLowerCase().match(/\b(\w+)\b/g) || [];
    }, [videoData]);
    
    const startExercise = () => {
        let sourceWords: string[] = [];
        if (wordSource === 'vocabulary' && vocabulary.length > 0) {
            sourceWords = vocabulary.map(v => v.word);
        } else {
            // Fallback to transcript if vocabulary is empty or selected
            sourceWords = Array.from(new Set(transcriptText));
        }

        const shuffled = sourceWords.sort(() => 0.5 - Math.random());
        setExerciseWords(shuffled.slice(0, wordCount));
        setIsStarted(true);
    };

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
                    <CardDescription>Choose your words and how many you want to practice with.</CardDescription>
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
                     <div className="space-y-3">
                         <Label>Word Source</Label>
                         <RadioGroup defaultValue="vocabulary" onValueChange={(value: 'vocabulary' | 'transcript') => setWordSource(value)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="vocabulary" id="r1" disabled={vocabulary.length === 0} />
                                <Label htmlFor="r1">From My Vocabulary List</Label>
                                {vocabulary.length === 0 && <span className="text-xs text-muted-foreground">(No words saved yet)</span>}
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="transcript" id="r2" />
                                <Label htmlFor="r2">Random Words from Transcript</Label>
                            </div>
                        </RadioGroup>
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
                    <CardTitle>Your Words</CardTitle>
                    <CardDescription>Use these words to write a few sentences or a short story.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {exerciseWords.map(word => (
                            <span key={word} className="bg-primary/10 text-primary font-semibold px-3 py-1 rounded-full text-sm">
                                {word}
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Textarea
                placeholder="Start writing here..."
                rows={10}
                className="text-base"
            />
            
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsStarted(false)}>Back to Settings</Button>
                <Button onClick={getFeedback} disabled={isGettingFeedback}>
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
                Use the selected words to practice your writing skills.
            </p>
        </div>
        <WritingWorkspace />
      </main>
    </>
  );
}
