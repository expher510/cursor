'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';


/** Initiate email/password sign-up (blocking to allow for error handling). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
  // User document creation is now handled by AuthProvider
  return userCredential;
}


/** Initiate email/password sign-in (blocking to allow for error handling). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
  // User document creation is now handled by AuthProvider
  return userCredential;
}

/** Initiate Google Sign-In with a popup (blocking). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(authInstance, provider);
  // User document creation is now handled by AuthProvider
  return userCredential;
}
