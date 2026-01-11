

'use client';
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useRef, useEffect }from "react";
import { useWatchPage, WatchPageProvider } from "@/context/watch-page-context";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { useUserProfile } from "@/hooks/use-user-profile";
import { generateWritingFeedback, type GenerateWritingFeedbackOutput } from "@/ai/flows/generate-writing-feedback-flow";
import { collection, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

function WritingWorkspace() {
    const { videoData, vocabulary, isLoading: isContextLoading } = useWatchPage();
    const { user, firestore } = useFirebase();
    const { userProfile } = useUserProfile();
    const { toast } = useToast();

    const [wordCount, setWordCount] = useState(10);
    const [exerciseWords, setExerciseWords] = useState<string[]>([]);
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [isStarted, setIsStarted] = useState(false);
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    const [feedbackResult, setFeedbackResult] = useState<GenerateWritingFeedbackOutput | null>(null);
    
    const editorRef = useRef<HTMLDivElement>(null);
    const lastSelectionRef = useRef<Range | null>(null);


    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handleBlur = () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (editor.contains(range.commonAncestorContainer)) {
                    lastSelectionRef.current = range.cloneRange();
                }
            }
        };

        editor.addEventListener('blur', handleBlur, true);
        return () => editor.removeEventListener('blur', handleBlur, true);
    }, [isStarted]);


    const transcriptText = useMemo(() => {
        if (!videoData?.transcript) return [];
        const fullText = videoData.transcript.map(t => t.text).join(' ');
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
        setFeedbackResult(null);
        lastSelectionRef.current = null;
    };

    const insertTextAtCursor = (text: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        if (!selection) return;

        let range;
        if (lastSelectionRef.current && selection.rangeCount > 0 && editor.contains(lastSelectionRef.current.commonAncestorContainer)) {
            range = lastSelectionRef.current;
            selection.removeAllRanges();
            selection.addRange(range);
        } else if (selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        } else {
            range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false); // to the end
        }
        
        range.deleteContents();
        
        const span = document.createElement('span');
        span.className = 'text-primary font-semibold';
        span.textContent = text;

        const leadingSpace = document.createTextNode(' ');
        const trailingSpace = document.createTextNode(' ');

        range.insertNode(trailingSpace);
        range.insertNode(span);
        range.insertNode(leadingSpace);
        
        range.setStartAfter(trailingSpace);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
        lastSelectionRef.current = range;
    };


    const handleWordClick = (word: string) => {
        insertTextAtCursor(word);
        setAvailableWords(prev => prev.filter(w => w !== word));
    };
    
    const resetExercise = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
        setIsStarted(false);
        setAvailableWords([]);
        setExerciseWords([]);
        setFeedbackResult(null);
        lastSelectionRef.current = null;
    }

    const getFeedback = async () => {
        if (!editorRef.current || !userProfile || !firestore || !user) return;
        const writingText = editorRef.current.innerText;
        if (writingText.trim().length < 10) {
             toast({ variant: "destructive", title: "Text is too short", description: "Please write a bit more before getting feedback."});
             return;
        }

        setIsGettingFeedback(true);
        setFeedbackResult(null);

        try {
            const feedback = await generateWritingFeedback({
                writingText,
                usedWords: exerciseWords,
                targetLanguage: userProfile.targetLanguage,
                nativeLanguage: userProfile.nativeLanguage,
                proficiencyLevel: userProfile.proficiencyLevel,
            });

            setFeedbackResult(feedback);

            // Save only the original text, not the feedback
            const feedbackCollectionRef = collection(firestore, `users/${user.uid}/writingFeedback`);
            await addDoc(feedbackCollectionRef, {
                userId: user.uid,
                videoId: videoData?.videoId || 'unknown',
                originalText: writingText,
                usedWords: exerciseWords,
                createdAt: Date.now()
            });

            toast({ title: "Writing Saved", description: "Your writing exercise has been saved."});

        } catch(e: any) {
            console.error("Failed to get or save feedback:", e);
            toast({ variant: "destructive", title: "Action Failed", description: e.message || "An error occurred while generating feedback or saving the text." });
        } finally {
            setIsGettingFeedback(false);
        }
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
                    'h-[200px] overflow-y-auto w-full rounded-md border border-input bg-background px-3 py-2 text-xl ring-offset-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    'leading-relaxed'
                )}
                style={{ overflowWrap: 'break-word' }}
                data-placeholder="Start writing or click a word bubble..."
             />
            
            <div className="flex justify-between items-center min-h-[40px]">
                <Button variant="outline" onClick={resetExercise}>Reset</Button>
                <div className="text-right">
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

            {feedbackResult && (
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            AI Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold">Overall Feedback (Score: {feedbackResult.score}/100)</h4>
                            <p className="text-muted-foreground">{feedbackResult.feedback}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold">Suggestions for Improvement</h4>
                            <ul className="list-disc pl-5 text-muted-foreground">
                                {feedbackResult.suggestions.map((suggestion, i) => (
                                    <li key={i}>{suggestion}</li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
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
