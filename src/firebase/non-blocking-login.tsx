'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

/** Initiate anonymous sign-in (blocking). */
export async function initiateAnonymousSignIn(authInstance: Auth) {
  return await signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (blocking to allow for error handling). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string) {
  return await createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (blocking to allow for error handling). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  return await signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google Sign-In with a popup (blocking). */
export async function initiateGoogleSignIn(authInstance: Auth) {
  const provider = new GoogleAuthProvider();
  return await signInWithPopup(authInstance, provider);
}
