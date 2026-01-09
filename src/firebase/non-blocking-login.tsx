
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
import { doc, getDoc, Firestore, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/**
 * Ensures a user document exists in Firestore. If it doesn't, it creates one.
 * This is CRITICAL for new and existing users to avoid permission errors on first login.
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
            
            // This is the operation that requires correct permissions.
            // The security rules should allow a user to create their own document.
            await setDoc(userDocRef, userData);

            console.log(`Successfully created user document for ${user.uid}.`);
        }
    } catch (error: any) {
        console.error("Error in ensureUserDocument:", error);
        
        // Create a contextual error for better debugging and emit it.
        const contextualError = new FirestorePermissionError({
            operation: 'write',
            path: `users/${user.uid}`,
            requestResourceData: { email: user.email, id: user.uid }
        }, auth);
        
        errorEmitter.emit('permission-error', contextualError);
        // Re-throw the error so downstream logic knows something went wrong.
        throw contextualError;
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

    