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
import { doc, setDoc, getDoc, Firestore } from 'firebase/firestore';


/**
 * Ensures a user document exists in Firestore. If it doesn't, it creates one.
 * This is crucial for new user sign-ups and as a fallback for existing users.
 * @param firestore The Firestore instance.
 * @param user The authenticated user object from Firebase Auth.
 */
async function ensureUserDocument(firestore: Firestore, user: User) {
    if (!user || !firestore) return;

    const userDocRef = doc(firestore, `users/${user.uid}`);
    
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            console.log(`User document for ${user.uid} does not exist. Creating...`);
            await setDoc(userDocRef, {
                id: user.uid,
                email: user.email,
            });
            console.log(`Successfully created document for user ${user.uid}.`);
        }
    } catch (error) {
        console.error("Error in ensureUserDocument:", error);
        // This error should be logged, but we won't re-throw it to avoid
        // breaking the login/signup flow on a failed write.
    }
}


/** Initiate email/password sign-up and create user doc. */
export async function initiateEmailSignUp(auth: Auth, firestore: Firestore, email: string, password: string): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // After successful auth creation, create the user document in Firestore.
  await ensureUserDocument(firestore, userCredential.user);
  return userCredential;
}


/** Initiate email/password sign-in and ensure user doc exists. */
export async function initiateEmailSignIn(auth: Auth, firestore: Firestore, email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // After successful sign-in, ensure the user document exists as a fallback.
  await ensureUserDocument(firestore, userCredential.user);
  return userCredential;
}

/** Initiate Google Sign-In and ensure user doc exists. */
export async function initiateGoogleSignIn(auth: Auth, firestore: Firestore): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  // After successful sign-in, ensure the user document exists.
  await ensureUserDocument(firestore, userCredential.user);
  return userCredential;
}
