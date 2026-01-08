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
    }
    
    // If user is logged in and is on a public page (like /login or /signup)
    if (user && isPublicPath) {
      router.replace(DEFAULT_AUTHENTICATED_ROUTE);
    }
    
  }, [user, isUserLoading, pathname, router]);

  // Show a loader while determining auth state or if a redirect is imminent.
  const showLoader = isUserLoading || 
                     (!user && !PUBLIC_PATHS.includes(pathname)) || 
                     (user && PUBLIC_PATHS.includes(pathname));


  if (showLoader) {
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
