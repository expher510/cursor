'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/**
 * Attempts to sign in with fixed credentials. If the user doesn't exist, it creates it first.
 * This is a workaround for environments where new user sign-ups might be restricted.
 */
export function initiateFixedUserSignIn(authInstance: Auth): void {
  const email = 'user@example.com';
  const password = 'password123';

  signInWithEmailAndPassword(authInstance, email, password)
    .catch((error) => {
      // If the user does not exist, create them.
      if (error.code === 'auth/user-not-found') {
        console.log("Fixed user not found, attempting to create...");
        createUserWithEmailAndPassword(authInstance, email, password)
          .catch((creationError) => {
             // If creation also fails, it's likely a configuration issue.
             console.error("Failed to create the fixed user:", creationError);
          });
      } else if (error.code === 'auth/wrong-password') {
          console.error("Warning: The password for the fixed user is incorrect. This may happen if the project was re-created.");
      } else {
        // Log other sign-in errors
        console.error("Error signing in the fixed user:", error);
      }
    });
}


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
