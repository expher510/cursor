
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

function WritingWorkspace() {
    const { videoData, vocabulary, isLoading: isContextLoading } = useWatchPage();
    const [wordCount, setWordCount] = useState(10);
    const [wordSource, setWordSource] = useState<'vocabulary' | 'transcript'>('vocabulary');
    const [exerciseWords, setExerciseWords] = useState<string[]>([]);
    const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
    const [writingContent, setWritingContent] = useState("");
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
            sourceWords = Array.from(new Set(transcriptText));
        }

        const shuffled = sourceWords.sort(() => 0.5 - Math.random());
        setExerciseWords(shuffled.slice(0, wordCount));
        setWritingContent("");
        setUsedWords(new Set());
        setIsStarted(true);
    };

    const handleWordClick = (word: string) => {
        setWritingContent(prev => prev ? `${prev} ${word}` : word);
        // Also update the writingContent to reflect which words have been used
        const newUsedWords = new Set(usedWords);
        if (writingContent.toLowerCase().includes(word.toLowerCase())) {
           newUsedWords.add(word);
        }
        setUsedWords(newUsedWords);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const currentText = e.target.value;
        setWritingContent(currentText);

        const newUsedWords = new Set<string>();
        exerciseWords.forEach(word => {
            if (currentText.toLowerCase().includes(word.toLowerCase())) {
                newUsedWords.add(word);
            }
        });
        setUsedWords(newUsedWords);
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
                    <CardDescription>Click a word to add it to your text, or type freely. Used words will be highlighted.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {exerciseWords.map(word => (
                            <Button
                                key={word}
                                variant={usedWords.has(word) ? "secondary" : "outline"}
                                className={cn(
                                    "font-semibold capitalize transition-all",
                                    usedWords.has(word) && "text-muted-foreground line-through"
                                )}
                                onClick={() => handleWordClick(word)}
                            >
                                {word}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Textarea
                placeholder="Click words above or type here..."
                rows={10}
                className="text-base"
                value={writingContent}
                onChange={handleTextChange}
            />
            
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsStarted(false)}>Back to Settings</Button>
                <Button onClick={getFeedback} disabled={isGettingFeedback || !writingContent}>
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
        <WatchPageProvider>
            <WritingWorkspace />
        </WatchPageProvider>
      </main>
    </>
  );
}
