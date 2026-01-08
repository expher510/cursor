'use client';

import { useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type HistoryItem = {
    id: string;
    title: string;
    timestamp: number;
};

function HistoryCard({ item, isSelected, onSelect }: { item: HistoryItem, isSelected: boolean, onSelect: (id: string) => void }) {
    const { firestore, user } = useFirebase();

    const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (!firestore || !user) return;

        const videoDocRef = doc(firestore, `users/${user.uid}/videos`, item.id);
        const transcriptDocRef = doc(firestore, `users/${user.uid}/videos/${item.id}/transcripts`, item.id);
        
        try {
            await deleteDoc(videoDocRef);
            await deleteDoc(transcriptDocRef);
        } catch (error) {
            console.error("Error deleting video history:", error);
        }
    };

    return (
        <div className="group relative">
            <Card 
                className={cn(
                    "overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full text-left",
                    isSelected && "ring-2 ring-primary shadow-lg"
                )}
                onClick={() => onSelect(item.id)}
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
                className="absolute top-2 right-2 h-8 w-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete video</span>
            </Button>
        </div>
    );
}

type VideoHistoryProps = {
    selectedVideoId: string | null;
    onVideoSelect: (id: string) => void;
};

export function VideoHistory({ selectedVideoId, onVideoSelect }: VideoHistoryProps) {
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
    
    // Filter out the placeholder document from the UI
    const displayHistory = useMemo(() => {
        return history?.filter(item => item.id !== '_placeholder') || [];
    }, [history]);


    if (isLoading) {
        return (
            <div className="w-full">
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
    
    if (!displayHistory || displayHistory.length === 0) {
        return <div className="text-center text-muted-foreground py-8">No recent videos to show.</div>; 
    }

    return (
        <div className="w-full">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayHistory.map((item) => (
                    <HistoryCard 
                        key={item.id} 
                        item={item}
                        isSelected={item.id === selectedVideoId}
                        onSelect={onVideoSelect}
                    />
                ))}
             </div>
        </div>
    );
}
