
'use client';
import { AppHeader } from "@/components/app-header";
import { Logo } from "@/components/logo";
import { useFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Youtube } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


type SpeakingAttempt = {
    id: string;
    userId: string;
    videoId: string;
    audioUrl: string;
    timestamp: number;
};

function SpeakingAttemptCard({ attempt }: { attempt: SpeakingAttempt }) {
    const { firestore, user } = useFirebase();

    const handleDelete = async () => {
        if (!user || !firestore) return;
        const docRef = doc(firestore, `users/${user.uid}/speakingAttempts`, attempt.id);
        try {
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Failed to delete speaking attempt:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    Practice from {formatDistanceToNow(new Date(attempt.timestamp), { addSuffix: true })}
                </CardTitle>
                 <CardDescription>
                    Video ID: {attempt.videoId}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <audio controls src={attempt.audioUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
            </CardContent>
            <CardFooter className="justify-between">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/reading?v=${attempt.videoId}&shouldGenerate=false`}>
                        <Youtube className="mr-2 h-4 w-4" />
                        Go to Video
                    </Link>
                </Button>
                <Button variant="destructive" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
            </CardFooter>
        </Card>
    )
}


export default function SpeakingPracticePage() {
    const { firestore, user } = useFirebase();
    const router = useRouter();

    const attemptsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/speakingAttempts`), orderBy('timestamp', 'desc'));
    }, [user, firestore]);

    const { data: attempts, isLoading } = useCollection<SpeakingAttempt>(attemptsQuery);
    
    return (
        <>
            <AppHeader showBackButton={true} />
            <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
                <div className="text-center flex flex-col items-center gap-4">
                    <Logo />
                    <p className="text-muted-foreground max-w-2xl">
                        Review your saved speaking practice sessions. Listen to your recordings and track your progress.
                    </p>
                </div>
                
                <div className="w-full max-w-2xl space-y-6">
                    {isLoading && (
                        <>
                           <Skeleton className="h-40 w-full" />
                           <Skeleton className="h-40 w-full" />
                           <Skeleton className="h-40 w-full" />
                        </>
                    )}

                    {!isLoading && (!attempts || attempts.length === 0) && (
                        <div className="flex flex-col items-center gap-4 text-center border-dashed border rounded-lg p-12 mt-8">
                            <h3 className="text-xl font-semibold">No Recordings Found</h3>
                            <p className="text-muted-foreground">
                                Your saved speaking exercises from the "Reading" page will appear here.
                            </p>
                            <Button onClick={() => router.push('/')} variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Home
                            </Button>
                        </div>
                    )}
                    
                    {!isLoading && attempts && attempts.map(attempt => (
                        <SpeakingAttemptCard key={attempt.id} attempt={attempt} />
                    ))}
                </div>
            </main>
        </>
    );
}
