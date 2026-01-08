'use client';

import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { Loader2, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * This function is the same as in non-blocking-login, but brought here
 * to be used directly for a manual sync.
 */
async function ensureUserDocument(firestore: any, user: any) {
  if (user) {
    const userDocRef = doc(firestore, `users/${user.uid}`);
    const userDocSnap = await getDoc(userDocRef);

    // Only run if the user document doesn't already exist
    if (!userDocSnap.exists()) {
      const batch = writeBatch(firestore);

      // 1. Set the main user document
      batch.set(
        userDocRef,
        {
          id: user.uid,
          email: user.email,
        },
        { merge: true }
      );

      // 2. Proactively create a placeholder document in the 'videos' subcollection
      const videosPlaceholderRef = doc(firestore, `users/${user.uid}/videos`, '_placeholder');
      batch.set(videosPlaceholderRef, { initializedAt: Date.now() });

      // Commit the batch operation atomically
      await batch.commit();
      return true; // Indicates that a new record was created
    }
  }
  return false; // Indicates that the record already existed
}

export default function SyncUsersPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to sync your account.',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const wasCreated = await ensureUserDocument(firestore, user);
      if (wasCreated) {
        toast({
          title: 'Success!',
          description: 'Your account has been successfully created in the database.',
        });
      } else {
        toast({
          title: 'All Set!',
          description: 'Your account already exists in the database. No action was needed.',
        });
      }
    } catch (error: any) {
      console.error('Error syncing user:', error);
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <AppHeader showBackButton={true} />
      <main className="container mx-auto pt-24 flex flex-col items-center gap-8 px-4 pb-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Sync Account to Database</CardTitle>
            <CardDescription>
              If your data (like video history) isn't saving, your account might be missing from the database. Click this button to fix it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              {isUserLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : user ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Logged in as: <strong>{user.email}</strong>
                  </p>
                  <Button onClick={handleSync} disabled={isSyncing} className="w-full">
                    {isSyncing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserCheck className="mr-2 h-4 w-4" />
                    )}
                    Sync My Account to Firestore
                  </Button>
                </>
              ) : (
                <p className="text-center text-red-500">Please log in first.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
