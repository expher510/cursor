
'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, Firestore, writeBatch, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/**
 * Ensures a user document exists in Firestore. If it doesn't, it creates one
 * along with a placeholder document in the 'videos' subcollection.
 * This is CRITICAL for new and existing users to avoid permission errors.
 * @param firestore The Firestore instance.
 * @param user The authenticated user object from Firebase Auth.
 * @param auth The Firebase Auth instance.
 */
export async function ensureUserDocument(firestore: Firestore, user: User, auth: Auth) {
    if (!user || !firestore) return;

    const userDocRef = doc(firestore, `users/${user.uid}`);
    
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            console.log(`User document for ${user.uid} does not exist. Creating...`);
            
            const userData = { id: user.uid, email: user.email };
            
            // Try to set the user document.
            // We do NOT use a batch here anymore. We try to create the user doc first.
            // If this fails, the error handler will catch it and show the detailed error.
            // This is better for debugging security rules than a silent batch failure.
            await setDoc(userDocRef, userData).catch(error => {
                console.error("Firestore setDoc failed for user document:", error);
                const contextualError = new FirestorePermissionError({
                    operation: 'create',
                    path: userDocRef.path,
                    requestResourceData: userData
                }, auth);
                errorEmitter.emit('permission-error', contextualError);
                throw contextualError; // Re-throw to stop execution
            });

            console.log(`Successfully created user document for ${user.uid}.`);
        }
    } catch (error: any) {
        // This will catch errors from getDoc and from the re-thrown setDoc error.
        console.error("Error in ensureUserDocument:", error);
        
        // If it's not our custom error, it's an unexpected issue.
        // We don't emit it as a permission error, just log it.
        // The custom error is already emitted and thrown inside the catch block above.
        if (!(error instanceof FirestorePermissionError)) {
             // We can choose to wrap it or just rethrow
            throw error;
        }
    }
}


/** Initiate email/password sign-up. */
export async function initiateEmailSignUp(auth: Auth, firestore: Firestore, email: string, password: string): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // The AuthProvider will handle ensuring the user document exists.
  return userCredential;
}


/** Initiate email/password sign-in. */
export async function initiateEmailSignIn(auth: Auth, firestore: Firestore, email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // The AuthProvider will handle ensuring the user document exists.
  return userCredential;
}

/** Initiate Google Sign-In. */
export async function initiateGoogleSignIn(auth: Auth, firestore: Firestore): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  // The AuthProvider will handle ensuring the user document exists.
  return userCredential;
}
