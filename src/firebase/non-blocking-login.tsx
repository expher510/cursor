
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
import { MOCK_QUIZ_QUESTIONS } from '@/lib/quiz-data';


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
            console.log(`User document for ${user.uid} does not exist. Creating with placeholder content...`);
            
            const batch = writeBatch(firestore);

            // 1. Create the main user document
            const userData = { id: user.uid, email: user.email };
            batch.set(userDocRef, userData);

            // 2. Create placeholder video history
            const placeholderVideos = [
                { id: 'xVOtjsqcElg', title: 'Nothing is Free', timestamp: Date.now() - 1000 },
                { id: 'nH87D5wN2fM', title: 'Adolf Hitler\'s Story', timestamp: Date.now() - 2000 },
                { id: 'xVOtjsqcElg', title: 'Nothing is Free', timestamp: Date.now() - 3000 },
            ];

            placeholderVideos.forEach(video => {
                const videoDocRef = doc(firestore, `users/${user.uid}/videos`, video.id);
                batch.set(videoDocRef, { ...video, userId: user.uid });
            });
            
            // 3. Create a placeholder quiz for one of the videos
            const quizVideoId = 'xVOtjsqcElg';
            const quizDocRef = doc(firestore, `users/${user.uid}/videos/${quizVideoId}/quizzes`, 'initial-quiz');
            batch.set(quizDocRef, {
                videoId: quizVideoId,
                userId: user.uid,
                id: 'initial-quiz',
                questions: MOCK_QUIZ_QUESTIONS,
            });


            // Commit the batch
            await batch.commit().catch(error => {
                console.error("Firestore batch commit failed for new user setup:", error);
                const contextualError = new FirestorePermissionError({
                    operation: 'write', // Batch can contain multiple operations
                    path: `users/${user.id}`,
                    requestResourceData: { userData, placeholderVideos }
                }, auth);
                errorEmitter.emit('permission-error', contextualError);
                throw contextualError; // Re-throw to stop execution
            });

            console.log(`Successfully created user document and placeholder history for ${user.uid}.`);
        }
    } catch (error: any) {
        // This will catch errors from getDoc and from the re-thrown batch.commit error.
        console.error("Error in ensureUserDocument:", error);
        
        if (!(error instanceof FirestorePermissionError)) {
            const contextualError = new FirestorePermissionError({
                operation: 'write',
                path: `users/${user.uid}`,
             }, auth);
             errorEmitter.emit('permission-error', contextualError);
             throw contextualError;
        }
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
