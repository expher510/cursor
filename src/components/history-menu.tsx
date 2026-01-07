"use client";

import Link from "next/link";
import { History, Trash2, Video } from "lucide-react";
import { Button } from "./ui/button";
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import { ScrollArea } from "./ui/scroll-area";
import { usePathname, useSearchParams } from "next/navigation";
import { useFirebase } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, orderBy, limit, writeBatch, doc } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "./ui/skeleton";

export function HistoryMenu() {
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
    
    // In a real app with many documents, you would query for documents in batches.
    // For this case, we assume the history from the hook is sufficient.
    history.forEach(item => {
      const docRef = doc(historyCollectionRef, item.id);
      batch.delete(docRef);
    });

    await batch.commit();
  };


  return (
    <SidebarGroup className="p-0">
      <SidebarGroupLabel className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <History />
          <span>History</span>
        </div>
        {history && history.length > 0 && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearHistory}>
            <Trash2 className="h-4 w-4"/>
            <span className="sr-only">Clear history</span>
          </Button>
        )}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {isLoading ? (
             <div className="space-y-1 px-2">
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-8 w-full" />
             </div>
          ) : !history || history.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">Your viewed videos will appear here.</div>
          ) : (
            <SidebarMenu>
              {history.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild isActive={pathname === '/watch' && currentVideoId === item.id}>
                    <Link href={`/watch?v=${item.id}`}>
                      <Video />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </ScrollArea>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
