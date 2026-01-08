'use client';

import { WatchPageProvider } from '@/context/watch-page-context';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function SuspenseFallback() {
    return (
      <div className="flex h-full w-full items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <WatchPageProvider>{children}</WatchPageProvider>
    </Suspense>
  );
}
