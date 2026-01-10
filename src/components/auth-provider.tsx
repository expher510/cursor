
'use client';

import { FirebaseContext, useFirebase } from '@/firebase/provider';
import { usePathname, useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ensureUserDocument } from '@/firebase/non-blocking-login';
import { OnboardingModal } from '@/components/onboarding-modal';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';

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

  if (user) {
    return <AuthenticatedFlow>{children}</AuthenticatedFlow>
  }
  
  return <>{children}</>;
}


function AuthenticatedFlow({ children }: { children: React.ReactNode }) {
    const { user, firestore, auth } = useFirebase();
    const { userProfile, isLoading: isProfileLoading, refetch, isEditing, setIsEditing } = useUserProfile();
    const [isEnsuringUserDoc, setIsEnsuringUserDoc] = useState(false);

    useEffect(() => {
        if (user && firestore && auth) {
            setIsEnsuringUserDoc(true);
            ensureUserDocument(firestore, user, auth)
            .catch(error => {
                console.error("AuthProvider: Failed to ensure user document on auth change. The error boundary should handle this.");
            }).finally(() => {
                setIsEnsuringUserDoc(false);
            });
        }
    }, [user, firestore, auth]);
    
    const handleOnboardingSave = async (data: { displayName: string; targetLanguage: string; proficiencyLevel: string; learningGoal?: string; }) => {
        if (!user || !firestore) return;
        const userDocRef = doc(firestore, `users/${user.uid}`);
        try {
            await setDoc(userDocRef, {
                ...data,
                onboardingCompleted: true,
            }, { merge: true });
            refetch(); // Refetch the user profile to hide the modal
            setIsEditing(false); // Close modal if it was in edit mode
        } catch (error) {
            console.error("Failed to save onboarding data:", error);
            // Optionally, show a toast to the user
        }
    };

    const isLoading = isProfileLoading || isEnsuringUserDoc;
    const showOnboarding = userProfile && !userProfile.onboardingCompleted;
    const showEditModal = isEditing && userProfile;


    if (isLoading) {
       return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Checking your profile...</p>
            </div>
        </div>
        );
    }

    return (
        <>
            {(showOnboarding || showEditModal) && (
                 <OnboardingModal
                    open={showOnboarding || showEditModal}
                    onSave={handleOnboardingSave}
                    isEditMode={showEditModal}
                    initialData={userProfile || undefined}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsEditing(false);
                        }
                    }}
                />
            )}
            {!(showOnboarding || showEditModal) && children}
        </>
    )
}
