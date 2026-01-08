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
import { doc, setDoc, getDoc, Firestore, writeBatch } from 'firebase/firestore';


/**
 * Ensures a user document exists in Firestore. If it doesn't, it creates one
 * along with a placeholder document in the 'videos' subcollection.
 * This is CRITICAL for new and existing users to avoid permission errors.
 * @param firestore The Firestore instance.
 * @param user The authenticated user object from Firebase Auth.
 */
export async function ensureUserDocument(firestore: Firestore, user: User) {
    if (!user || !firestore) return;

    const userDocRef = doc(firestore, `users/${user.uid}`);
    
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            console.log(`User document for ${user.uid} does not exist. Creating...`);
            
            const batch = writeBatch(firestore);

            // 1. Create the main user document
            batch.set(userDocRef, {
                id: user.uid,
                email: user.email,
            });

            // 2. Create a placeholder document in the 'videos' subcollection
            // This is crucial to ensure the collection path exists for security rules.
            const placeholderVideoRef = doc(firestore, `users/${user.uid}/videos`, '_placeholder');
            batch.set(placeholderVideoRef, {
                title: "Placeholder",
                timestamp: Date.now()
            });
            
            await batch.commit();

            console.log(`Successfully created document and videos subcollection for user ${user.uid}.`);
        }
    } catch (error) {
        console.error("Error in ensureUserDocument:", error);
         // We re-throw the error to ensure the calling function is aware of the failure.
        throw error;
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
