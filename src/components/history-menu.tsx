"use client";

import Link from "next/link";
import { History, Trash2, Video } from "lucide-react";
import { useHistory } from "@/hooks/use-history";
import { Button } from "./ui/button";
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";
import { ScrollArea } from "./ui/scroll-area";
import { usePathname, useSearchParams } from "next/navigation";

export function HistoryMenu() {
  const { history, clearHistory, isLoaded } = useHistory();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentVideoId = searchParams.get('v');


  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History />
          <span>History</span>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearHistory}>
            <Trash2 className="h-4 w-4"/>
            <span className="sr-only">Clear history</span>
          </Button>
        )}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {!isLoaded ? (
             <div className="p-2 text-sm text-muted-foreground">Loading history...</div>
          ) : history.length === 0 ? (
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
