
'use client';

import { FirebaseContext } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ensureUserDocument } from '@/firebase/non-blocking-login';
import { OnboardingModal } from '@/components/onboarding-modal';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PUBLIC_PATHS = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const context = useContext(FirebaseContext);
  const router = useRouter();
  const pathname = usePathname();
  const [isEnsuringUserDoc, setIsEnsuringUserDoc] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);


  if (context === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { user, isUserLoading, firestore, auth } = context;

  // Effect to sync user document and check onboarding status
  useEffect(() => {
    if (user && firestore && auth) {
      setIsEnsuringUserDoc(true);
      ensureUserDocument(firestore, user, auth)
        .then(async () => {
            const userDocRef = doc(firestore, `users/${user.uid}`);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && !userDocSnap.data().onboardingCompleted) {
                setShowOnboarding(true);
            }
        })
        .catch(error => {
        // The error is already logged and emitted by ensureUserDocument,
        // so we just need to prevent unhandled promise rejection here.
        console.error("AuthProvider: Failed to ensure user document on auth change. The error boundary should handle this.");
      }).finally(() => {
        setIsEnsuringUserDoc(false);
      });
    }
  }, [user, firestore, auth]);


  // Effect for handling redirection based on auth state
  useEffect(() => {
    if (isUserLoading || isEnsuringUserDoc) return; // Wait until auth and doc creation are resolved

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // If user is not logged in and is trying to access a protected page, redirect to login
    if (!user && !isPublicPath) {
      router.replace(`/login?from=${pathname}`);
    }
    
  }, [user, isUserLoading, isEnsuringUserDoc, pathname, router]);

  const handleOnboardingSave = async (data: { displayName: string; targetLanguage: string; proficiencyLevel: string; learningGoal?: string; }) => {
    if (!user || !firestore) return;
    const userDocRef = doc(firestore, `users/${user.uid}`);
    try {
        await setDoc(userDocRef, {
            ...data,
            onboardingCompleted: true,
        }, { merge: true });
        setShowOnboarding(false);
    } catch (error) {
        console.error("Failed to save onboarding data:", error);
        // Optionally, show a toast to the user
    }
  };

  // While auth is loading, or if we are on a protected route without a user, show a loader.
  if (isUserLoading || isEnsuringUserDoc || (!user && !PUBLIC_PATHS.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
        {showOnboarding && <OnboardingModal open={showOnboarding} onSave={handleOnboardingSave} />}
        {!showOnboarding && children}
    </>
  );
}
