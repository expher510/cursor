'use client';

import { useFirebase } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

const PUBLIC_PATHS = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is resolved

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is not logged in and not on a public page, initiate anonymous sign-in
    if (!user && !isPublicPath && auth) {
      initiateAnonymousSignIn(auth).catch(err => {
        console.error("Auto anonymous sign-in failed:", err);
        // If even anonymous fails, redirect to a login/error page to avoid an infinite loop
        router.replace('/login');
      });
    }
    
    // If user is logged in (including anonymous) and on a public page, redirect to home
    if (user && isPublicPath) {
      router.replace('/');
    }

  }, [user, isUserLoading, pathname, router, auth]);

  // Show a loader while determining auth state or if a redirect is imminent.
  // The check `!user && !isPublicPath` is important to show a loader while the
  // anonymous sign-in is in progress.
  if (isUserLoading || (!user && !PUBLIC_PATHS.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }
  
  // If user is logged in and tries to access a public path, we also show a loader
  // while redirecting to avoid flashing the login/signup page.
  if (user && PUBLIC_PATHS.includes(pathname)) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>;
}
