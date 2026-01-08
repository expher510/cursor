'use client';

import { FirebaseContext } from '@/firebase/provider';
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

  const { user, isUserLoading, firestore } = context;

  // Effect to sync user document to Firestore on auth state change
  useEffect(() => {
    if (user && firestore) {
      ensureUserDocument(firestore, user).catch(error => {
        console.error("Failed to ensure user document on auth change:", error);
      });
    }
  }, [user, firestore]);


  // Effect for handling redirection based on auth state
  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is resolved

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is not logged in and is trying to access a protected page, redirect to login
    if (!user && !isPublicPath) {
      router.replace(`/login?from=${pathname}`);
    }
    
  }, [user, isUserLoading, pathname, router]);

  // While auth is loading, or if we are on a protected route without a user, show a loader.
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
