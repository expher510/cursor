'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from './non-blocking-updates';

/** Initiate anonymous sign-in (blocking). */
export async function initiateAnonymousSignIn(authInstance: Auth) {
  return await signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (blocking to allow for error handling). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
  const user = userCredential.user;
  if (user) {
      const firestore = getFirestore(authInstance.app);
      const userDocRef = doc(firestore, `users/${user.uid}`);
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        email: user.email,
      }, {});
  }
  return userCredential;
}


/** Initiate email/password sign-in (blocking to allow for error handling). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  return await signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google Sign-In with a popup (blocking). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(authInstance, provider);
  const user = userCredential.user;
   if (user) {
      const firestore = getFirestore(authInstance.app);
      const userDocRef = doc(firestore, `users/${user.uid}`);
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        email: user.email,
      }, { merge: true }); // Use merge to avoid overwriting existing data if user logs in again
  }
  return userCredential;
}
