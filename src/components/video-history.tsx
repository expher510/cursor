'use client';

import { useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from './ui/button';
import { BookOpen, Edit, Headphones, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

type HistoryItem = {
    id: string;
    title: string;
    timestamp: number;
};

type ActivityType = 'watch' | 'reading' | 'writing';

function HistoryCard({ item, isActive, onSelect, onAction }: { item: HistoryItem, isActive: boolean, onSelect: (id: string) => void, onAction: (id: string, activity: ActivityType) => void }) {
    const { firestore, user } = useFirebase();
    const [popoverOpen, setPopoverOpen] = useState(false);

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

    const handleAction = (e: React.MouseEvent, activity: ActivityType) => {
        e.stopPropagation();
        onAction(item.id, activity);
        setPopoverOpen(false);
    }

    return (
        <div className="group relative">
            <Card 
                className={cn(
                    "overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full text-left",
                    isActive && "ring-2 ring-primary shadow-lg"
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
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                     <p className="absolute bottom-2 left-3 font-semibold text-sm text-white truncate w-[calc(100%-1.5rem)]">{item.title}</p>
                </div>
            </Card>
            
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity",
                            isActive && "opacity-100"
                        )}
                    >
                         <Button variant="secondary">Choose Activity</Button>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => handleAction(e, 'watch')}><Headphones className="mr-2"/> Listen</Button>
                        <Button variant="ghost" size="sm" onClick={(e) => handleAction(e, 'reading')}><BookOpen className="mr-2"/> Read</Button>
                        <Button variant="ghost" size="sm" onClick={(e) => handleAction(e, 'writing')}><Edit className="mr-2"/> Write</Button>
                    </div>
                </PopoverContent>
            </Popover>


            <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete video</span>
            </Button>
        </div>
    );
}

type VideoHistoryProps = {
    activeVideoId: string | null;
    onVideoSelect: (id: string) => void;
    onVideoAction: (id: string, activity: ActivityType) => void;
};

export function VideoHistory({ activeVideoId, onVideoSelect, onVideoAction }: VideoHistoryProps) {
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
             <h3 className="text-xl font-bold font-headline mb-4 text-center">Or Select From Your History</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayHistory.map((item) => (
                    <HistoryCard 
                        key={item.id} 
                        item={item}
                        isActive={item.id === activeVideoId}
                        onSelect={onVideoSelect}
                        onAction={onVideoAction}
                    />
                ))}
             </div>
        </div>
    );
}
