import type { ReactNode } from "react";
import { HistoryMenu } from "@/components/history-menu";
import { Logo } from "@/components/logo";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { VocabularyList } from "@/components/vocabulary-list";
import { WatchPageProvider } from "@/context/watch-page-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

export default function WatchLayout({ children }: { children: ReactNode }) {
  return (
    <WatchPageProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar>
            <SidebarHeader className="p-4">
              <Logo />
            </SidebarHeader>
            <Separator />
            <SidebarContent>
              <HistoryMenu />
            </SidebarContent>
          </Sidebar>
          
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>

          <aside className="hidden lg:block w-[300px] sticky top-0 h-screen border-l">
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
              <SheetContent side="right" className="w-[300px] p-0">
                <VocabularyList />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </SidebarProvider>
    </WatchPageProvider>
  );
}
