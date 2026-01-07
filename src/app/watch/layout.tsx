import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { HistoryMenu } from "@/components/history-menu";
import { Logo } from "@/components/logo";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { VocabularyList } from "@/components/vocabulary-list";
import { WatchPageProvider } from "@/context/watch-page-context";

export default function WatchLayout({ children }: { children: ReactNode }) {
  return (
    <WatchPageProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar>
            <SidebarHeader className="p-4">
              <Logo />
            </SidebarHeader>
            <Separator />
            <SidebarContent>
              <HistoryMenu />
            </SidebarContent>
          </Sidebar>
          
          <main className="flex-1">
            <AppHeader />
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>

          <aside className="hidden lg:block w-[300px] sticky top-0 h-screen border-l">
             <VocabularyList />
          </aside>
        </div>
      </SidebarProvider>
    </WatchPageProvider>
  );
}
