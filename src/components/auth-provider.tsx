'use client';

import { FirebaseContext } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, writeBatch } from 'firebase/firestore';

const PUBLIC_PATHS = ['/login', '/signup'];

/**
 * Ensures a user document and their essential subcollections are created in Firestore.
 * This function is designed to be called after a user is authenticated.
 * @param firestore The Firestore instance.
 * @param user The authenticated user object.
 */
async function ensureUserDocument(firestore: any, user: any) {
  if (!user || !firestore) return;

  const userDocRef = doc(firestore, `users/${user.uid}`);
  
  try {
    const userDocSnap = await getDoc(userDocRef);

    // Only run if the user document doesn't already exist
    if (!userDocSnap.exists()) {
      console.log(`User document for ${user.uid} does not exist. Creating it.`);
      const batch = writeBatch(firestore);

      // 1. Set the main user document
      batch.set(userDocRef, {
        id: user.uid,
        email: user.email,
      });

      // 2. Proactively create a placeholder document in the 'videos' subcollection
      const videosPlaceholderRef = doc(firestore, `users/${user.uid}/videos`, '_placeholder');
      batch.set(videosPlaceholderRef, { initializedAt: Date.now() });

      // Commit the batch operation atomically
      await batch.commit();
      console.log(`Successfully created document and subcollection for user ${user.uid}.`);
    }
  } catch (error) {
    console.error("Error in ensureUserDocument:", error);
    // This error should be logged for debugging, but we won't throw it
    // to avoid crashing the app on a background sync failure.
  }
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const context = useContext(FirebaseContext);
  const router = useRouter();
  const pathname = usePathname();

  // We can't know the user's state until the context is available.
  if (context === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { user, isUserLoading, firestore } = context;

  // Effect for handling redirection based on auth state
  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is resolved

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is not logged in and is trying to access a protected page, redirect to login
    if (!user && !isPublicPath) {
      router.replace(`/login?from=${pathname}`);
    }
    
  }, [user, isUserLoading, pathname, router]);

  // Effect for syncing user data to Firestore AFTER authentication is confirmed
  useEffect(() => {
    if (user && firestore) {
      ensureUserDocument(firestore, user);
    }
  }, [user, firestore]);


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
