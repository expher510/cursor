'use client';
import { WatchPageProvider } from "@/context/watch-page-context";

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WatchPageProvider>
        <main className="flex-1 p-4 md:p-6 pt-20">{children}</main>
    </WatchPageProvider>
  );
}
