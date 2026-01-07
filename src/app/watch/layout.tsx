import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { HistoryMenu } from "@/components/history-menu";
import { Logo } from "@/components/logo";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function WatchLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Logo />
          </SidebarHeader>
          <Separator />
          <SidebarContent>
            <HistoryMenu />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <AppHeader />
            <main className="p-4 lg:p-6">
              {children}
            </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
