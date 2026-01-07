'use client';
import { WatchPageHeader } from "@/components/watch-page-header";
import { WatchPageProvider } from "@/context/watch-page-context";

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WatchPageProvider>
      <WatchPageHeader />
      <main className="flex-1 p-4 md:p-6 pt-20">{children}</main>
    </WatchPageProvider>
  );
}
