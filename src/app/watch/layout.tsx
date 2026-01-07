"use client";

import type { ReactNode } from "react";
import { HistoryMenu } from "@/components/history-menu";
import { Logo } from "@/components/logo";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { VocabularyList } from "@/components/vocabulary-list";
import { WatchPageProvider, useWatchPage } from "@/context/watch-page-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List, PlusCircle } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import Link from "next/link";

function DraggableWord({ word, translation }: { word: string, translation: string }) {
  return (
    <Card className="px-2 py-1 bg-primary text-primary-foreground">
      <p className="font-semibold">{word}</p>
      <p className="text-xs">{translation}</p>
    </Card>
  );
}


function WatchLayoutDndWrapper({ children }: { children: ReactNode }) {
  const { onDragEnd, activeDragData, setActiveDragData } = useWatchPage();

  return (
     <DndContext 
      onDragStart={(event) => {
        if (event.active.data.current) {
          const { word, translation } = event.active.data.current;
          setActiveDragData({ word, translation });
        }
      }}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDragData(null)}
    >
        {children}
        <DragOverlay>
          {activeDragData ? (
             <DraggableWord word={activeDragData.word} translation={activeDragData.translation} />
          ) : null}
        </DragOverlay>
      </DndContext>
  )
}

export default function WatchLayout({ children }: { children: ReactNode }) {
  return (
    <WatchPageProvider>
      <WatchLayoutDndWrapper>
        <SidebarProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar>
              <SidebarHeader className="p-4">
                <Logo />
              </SidebarHeader>
              <SidebarContent className="p-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/">
                        <PlusCircle />
                        <span>New Video</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
                <Separator className="my-2" />
                <HistoryMenu />
              </SidebarContent>
            </Sidebar>
            
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>

            <aside className="hidden lg:block w-[250px] sticky top-0 h-screen border-l">
              <VocabularyList />
            </aside>

            <div className="lg:hidden fixed bottom-4 right-4 z-50">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon">
                    <List />
                    <span className="sr-only">Open Vocabulary</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] p-0">
                  <VocabularyList />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </SidebarProvider>
      </WatchLayoutDndWrapper>
    </WatchPageProvider>
  );
}
