'use client';

import { useFirebase } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/signup'];
const DEFAULT_AUTHENTICATED_ROUTE = '/';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is resolved

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is not logged in and is trying to access a protected page
    if (!user && !isPublicPath) {
      router.replace(`/login?from=${pathname}`);
      return;
    }
    
    // If user is logged in and is on a public page (like /login or /signup)
    if (user && isPublicPath) {
      router.replace(DEFAULT_AUTHENTICATED_ROUTE);
      return;
    }
    
  }, [user, isUserLoading, pathname, router]);

  // Show a loader only during the initial auth check.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // While redirecting, the page might show briefly. This is better than a loop.
  // Or, we can check the conditions again. If a redirect is needed, return the loader.
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  if (!user && !isPublicPath) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
