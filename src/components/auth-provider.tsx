'use client';

import { useFirebase } from '@/firebase/provider';
import { initiateFixedUserSignIn } from '@/firebase/non-blocking-login';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth, user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!user && !isUserLoading && auth) {
      // Use the new fixed user sign-in function to bypass signup restrictions
      initiateFixedUserSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

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

  return <>{children}</>;
}
