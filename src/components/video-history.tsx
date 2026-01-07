
'use client';

import { useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import type { Firestore } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type HistoryItem = {
    id: string;
    title: string;
    timestamp: number;
};

function HistoryCard({ item }: { item: HistoryItem }) {
    const router = useRouter();
    const { firestore, user } = useFirebase();

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();

        if (!firestore || !user) return;

        if (window.confirm("Are you sure you want to delete this video from your history?")) {
            const videoDocRef = doc(firestore, `users/${user.uid}/videos`, item.id);
            deleteDocumentNonBlocking(videoDocRef);

            // Also delete the associated transcript
            const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${item.id}/transcripts`, item.id);
            deleteDocumentNonBlocking(transcriptDocRef);
        }
    };
    
    const handleCardClick = () => {
        router.push(`/watch?v=${item.id}`);
    }

    return (
        <div className="group relative">
            <Card 
                className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full"
                onClick={handleCardClick}
            >
                <div className="relative aspect-video">
                    <Image
                        src={`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                </div>
                <div className="p-3">
                    <p className="font-semibold text-sm truncate group-hover:text-primary">{item.title}</p>
                </div>
            </Card>
            <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 z-10"
                onClick={handleDelete}
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete video</span>
            </Button>
        </div>
    );
}


export function VideoHistory() {
    const { firestore, user } = useFirebase();

    const historyQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/videos`),
            orderBy("timestamp", "desc"),
            limit(20)
        );
    }, [user, firestore]);

    const { data: history, isLoading } = useCollection<HistoryItem>(historyQuery);

    if (isLoading) {
        return (
            <div className="w-full max-w-4xl pt-10">
                <h2 className="text-2xl font-bold font-headline mb-6">Your Recent Videos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-28 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (!history || history.length === 0) {
        return null; // Don't show the section if there is no history
    }

    return (
        <div className="w-full max-w-4xl pt-10 text-left">
             <h2 className="text-2xl font-bold font-headline mb-6">Your Recent Videos</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((item) => (
                    user && firestore && <HistoryCard key={item.id} item={item} />
                ))}
             </div>
        </div>
    );
}
