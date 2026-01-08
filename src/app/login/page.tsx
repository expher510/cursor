
'use client';

import { useFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * This page now serves as a temporary gateway for anonymous authentication.
 * It will attempt to sign the user in anonymously and then redirect them.
 * This avoids the need for user interaction on this page while Google/Email auth is being fixed.
 */
export default function LoginPage() {
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    // If a user is already logged in (from a previous session or the AuthProvider), redirect them.
    if (!isUserLoading && user) {
      setStatus('User found, redirecting...');
      const from = searchParams.get('from') || '/';
      router.replace(from);
      return;
    }

    // If there's no user and auth service is available, attempt anonymous sign-in.
    if (!isUserLoading && !user && auth) {
      setStatus('No user found, attempting anonymous sign-in...');
      initiateAnonymousSignIn(auth)
        .then(() => {
          setStatus('Anonymous sign-in successful, redirecting...');
          // The onAuthStateChanged listener in AuthProvider will catch the new user
          // and the redirect will be handled by the next run of this effect.
        })
        .catch((error) => {
          console.error('Anonymous sign-in failed:', error);
          setStatus('Anonymous sign-in failed. Please check console for errors.');
        });
    }
  }, [user, isUserLoading, auth, router, searchParams]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="flex items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="text-2xl font-semibold text-muted-foreground">{status}</h1>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        You are being automatically signed in to continue testing the app.
      </p>
    </main>
  );
}
