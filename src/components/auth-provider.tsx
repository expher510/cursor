
'use client';

import { FirebaseContext, useFirebase } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ensureUserDocument } from '@/firebase/non-blocking-login';

const PUBLIC_PATHS = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const context = useContext(FirebaseContext);
  const router = useRouter();
  const pathname = usePathname();
  
  if (context === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { user, isUserLoading, firestore, auth } = context;

  // Effect for handling redirection based on auth state
  useEffect(() => {
    if (isUserLoading) return; 

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is not logged in and is trying to access a protected page, redirect to login
    if (!user && !isPublicPath) {
      router.replace(`/login?from=${pathname}`);
    }
    
  }, [user, isUserLoading, pathname, router]);

  // Effect to ensure user document exists on login
   useEffect(() => {
    if (user && firestore && auth) {
      ensureUserDocument(firestore, user, auth).catch(error => {
        console.error("AuthProvider: Failed to ensure user document on auth change. The error boundary should handle this.");
      });
    }
  }, [user, firestore, auth]);


  if (isUserLoading || (!user && !PUBLIC_PATHS.includes(pathname))) {
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
