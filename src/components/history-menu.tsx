"use client";

import Link from "next/link";
import { History, Trash2, Video } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { usePathname, useSearchParams } from "next/navigation";
import { useFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, orderBy, limit, writeBatch, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

export function HistoryMenu({ isMobile = false, onLinkClick }: { isMobile?: boolean, onLinkClick?: () => void }) {
  const { firestore, user } = useFirebase();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentVideoId = searchParams.get('v');

  const historyQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/videos`),
      orderBy("timestamp", "desc"),
      limit(50)
    );
  }, [user, firestore]);

  const { data: history, isLoading } = useCollection<{id: string, title: string, timestamp: number}>(historyQuery);

  const clearHistory = async () => {
    if (!firestore || !user || !history) return;

    const batch = writeBatch(firestore);
    const historyCollectionRef = collection(firestore, `users/${user.uid}/videos`);
    
    history.forEach(item => {
      const docRef = doc(historyCollectionRef, item.id);
      batch.delete(docRef);
    });

    await batch.commit();
  };


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5"/> History
        </h2>
        {history && history.length > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearHistory}>
            <Trash2 className="h-4 w-4"/>
            <span className="sr-only">Clear history</span>
          </Button>
        )}
      </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
             <div className="space-y-2 p-4">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
             </div>
          ) : !history || history.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Your viewed videos will appear here.</div>
          ) : (
            <nav className="p-2">
              {history.map((item) => (
                <Link 
                    href={`/watch?v=${item.id}`}
                    key={item.id}
                    onClick={onLinkClick}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                        pathname === '/watch' && currentVideoId === item.id && "bg-muted text-primary"
                    )}
                >
                  <Video className="h-4 w-4" />
                  <span className="truncate flex-1">{item.title}</span>
                </Link>
              ))}
            </nav>
          )}
        </ScrollArea>
    </div>
  );
}
