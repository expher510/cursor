'use client';

import { useFirebase } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is resolved

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is not logged in and not on a public page, redirect to login
    if (!user && !isPublicPath) {
      router.replace(`/login?from=${pathname}`);
    }
    
    // If user is logged in and on a public page, redirect to home
    if (user && isPublicPath) {
      router.replace('/');
    }

  }, [user, isUserLoading, pathname, router]);

  // Show a loader while determining auth state or if a redirect is imminent.
  if (isUserLoading || (!user && !PUBLIC_PATHS.includes(pathname)) || (user && PUBLIC_PATHS.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
