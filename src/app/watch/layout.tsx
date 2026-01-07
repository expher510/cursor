'use client';
import { AppHeader } from "@/components/app-header";
import { WatchPageProvider } from "@/context/watch-page-context";

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WatchPageProvider>
      <div className="flex min-h-screen w-full flex-col">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 pt-20">{children}</main>
      </div>
    </WatchPageProvider>
  );
}
