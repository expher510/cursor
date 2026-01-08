'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';


/**
 * Ensures a user document exists in Firestore.
 * This is a blocking operation to prevent race conditions on initial login/signup.
 * @param authInstance The Firebase Auth instance.
 * @param user The user object from the credential.
 */
async function ensureUserDocument(authInstance: Auth, user: UserCredential['user']) {
    if (user) {
        const firestore = getFirestore(authInstance.app);
        const userDocRef = doc(firestore, `users/${user.uid}`);
        
        // Use await to ensure this completes before proceeding.
        // Use { merge: true } to safely create or update without overwriting existing data.
        await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
        }, { merge: true });
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
