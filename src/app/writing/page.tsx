

'use client';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef }from "react";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Loader2, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/firebase";

function WritingWorkspace() {
    const { videoData, vocabulary, isLoading: isContextLoading } = useWatchPage();
    const { user } = useFirebase();
    const [wordCount, setWordCount] = useState(10);
    const [exerciseWords, setExerciseWords] = useState<string[]>([]);
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [isStarted, setIsStarted] = useState(false);
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    
    const editorRef = useRef<HTMLDivElement>(null);

    const transcriptText = useMemo(() => {
        if (!videoData?.transcript) return [];
        const fullText = videoData.transcript.map(t => t.text).join(' ');
        // Get unique words from transcript, ensuring only alphabetical words are matched
        return Array.from(new Set(fullText.toLowerCase().match(/\b([a-zA-Z]+)\b/g) || []));
    }, [videoData]);
    
    const startExercise = () => {
        const vocabWords = [...new Set(vocabulary.map(v => v.word.toLowerCase()))];
        const shuffledVocab = vocabWords.sort(() => 0.5 - Math.random());
        
        let words = shuffledVocab.slice(0, wordCount);
        
        const wordsNeeded = wordCount - words.length;

        if (wordsNeeded > 0) {
            const vocabSet = new Set(words);
            const transcriptWords = transcriptText.filter(w => !vocabSet.has(w));
            const shuffledTranscript = transcriptWords.sort(() => 0.5 - Math.random());
            
            words = [...words, ...shuffledTranscript.slice(0, wordsNeeded)];
        }

        const finalWords = words.sort(() => 0.5 - Math.random());
        setExerciseWords(finalWords);
        setAvailableWords(finalWords);
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
        setIsStarted(true);
        setIsConfirmed(false);
    };

    const insertTextAtCursor = (text: string, isStyled: boolean) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        let range = selection.getRangeAt(0);
        range.deleteContents(); // Clear any selected text

        const nodeBefore = range.startContainer.nodeType === Node.TEXT_NODE
            ? range.startContainer.textContent?.substring(0, range.startOffset)
            : editor.innerText;
        
        const leadingSpace = !/\s$/.test(nodeBefore || '') && (nodeBefore || '').length > 0 ? ' ' : '';
        const trailingSpace = ' ';
        
        if (isStyled) {
            const span = document.createElement('span');
            span.className = 'text-primary';
            span.textContent = text;
            
            const leading = document.createTextNode(leadingSpace);
            const trailing = document.createTextNode(trailingSpace);

            range.insertNode(trailing);
            range.insertNode(span);
            range.insertNode(leading);
            
            range.setStartAfter(trailing);
            range.collapse(true);
        } else {
            const textNode = document.createTextNode(leadingSpace + text + trailingSpace);
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.collapse(true);
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
    }


    const handleWordClick = (word: string) => {
        insertTextAtCursor(word, true);
        setAvailableWords(prev => prev.filter(w => w !== word));
    };
    
    const resetExercise = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
        setIsStarted(false);
        setAvailableWords([]);
        setExerciseWords([]);
        setIsConfirmed(false);
    }

    const getFeedback = async () => {
        setIsGettingFeedback(true);
        // Placeholder for AI feedback flow
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsGettingFeedback(false);
        setIsConfirmed(true);
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
            
            <div className="min-h-[6rem] flex flex-wrap gap-3 justify-center">
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

             <div
                ref={editorRef}
                contentEditable={true}
                className={cn(
                    'min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xl ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    'leading-relaxed break-words'
                )}
                data-placeholder="Start writing or click a word bubble..."
             />
            
            <div className="flex justify-between items-center min-h-[40px]">
                <Button variant="outline" onClick={resetExercise}>Reset</Button>
                <div className="text-right">
                    {isConfirmed ? (
                        <div className="text-sm text-muted-foreground">
                            <p>A detailed performance evaluation will be sent to:</p>
                            <p className="text-base font-semibold text-primary">{user?.email}</p>
                        </div>
                    ) : (
                        <Button onClick={getFeedback} disabled={isGettingFeedback || availableWords.length > 0}>
                            {isGettingFeedback ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Confirm
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function WritingPage() {
  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <div className="flex justify-center">
            <Logo />
        </div>
        <p className="text-muted-foreground max-w-2xl text-center">
            Use the selected words to practice your writing skills. When you've used all the words, you can get AI feedback.
        </p>
        <WatchPageProvider>
            <WritingWorkspace />
        </WatchPageProvider>
      </main>
    </>
  );
}
