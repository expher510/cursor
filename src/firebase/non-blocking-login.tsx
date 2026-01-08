'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';


/**
 * Ensures a user document and their essential subcollections are created in Firestore.
 * This is a blocking operation to prevent race conditions on initial login/signup.
 * @param authInstance The Firebase Auth instance.
 * @param user The user object from the credential.
 */
async function ensureUserDocument(authInstance: Auth, user: UserCredential['user']) {
    if (user) {
        const firestore = getFirestore(authInstance.app);
        const batch = writeBatch(firestore);

        // 1. Reference to the main user document
        const userDocRef = doc(firestore, `users/${user.uid}`);
        batch.set(userDocRef, {
            id: user.uid,
            email: user.email,
        }, { merge: true });

        // 2. Proactively create a placeholder document in the 'videos' subcollection
        // This ensures the subcollection exists and is readable immediately after signup,
        // preventing "Missing or insufficient permissions" errors for new users.
        const videosPlaceholderRef = doc(firestore, `users/${user.uid}/videos`, '_placeholder');
        batch.set(videosPlaceholderRef, { initializedAt: Date.now() });
        
        // Commit the batch operation atomically
        await batch.commit();
    }
}


/** Initiate email/password sign-up (blocking to allow for error handling). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
  await ensureUserDocument(authInstance, userCredential.user);
  return userCredential;
}


/** Initiate email/password sign-in (blocking to allow for error handling). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  // Sign-in itself doesn't need to create the document, but we can ensure it exists
  // for consistency, especially for users created before this logic was in place.
  const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
  await ensureUserDocument(authInstance, userCredential.user);
  return userCredential;
}

/** Initiate Google Sign-In with a popup (blocking). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(authInstance, provider);
  await ensureUserDocument(authInstance, userCredential.user);
  return userCredential;
}
