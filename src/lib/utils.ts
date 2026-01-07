import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch, type Firestore } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  
  // Already a video ID (11 characters, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Standard YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function deleteVideoAndAssociatedData(firestore: Firestore, userId: string, videoId: string) {
    if (!firestore || !userId || !videoId) {
        console.error("Missing required parameters for deletion.");
        return;
    }

    // Use a try-catch block for the async operations inside, although the function itself is not async
    const performDelete = async () => {
        try {
            const batch = writeBatch(firestore);

            // 1. Delete the main video document
            const videoDocRef = doc(firestore, `users/${userId}/videos/${videoId}`);
            batch.delete(videoDocRef);

            // 2. Delete the transcript document
            const transcriptDocRef = doc(firestore, `users/${userId}/videos/${videoId}/transcripts/${videoId}`);
            batch.delete(transcriptDocRef);

            // 3. Query and delete associated vocabulary items
            const vocabCollectionRef = collection(firestore, `users/${userId}/vocabularies`);
            const q = query(vocabCollectionRef, where("videoId", "==", videoId));
            const vocabQuerySnapshot = await getDocs(q);
            
            vocabQuerySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // 4. Commit the batch
            await batch.commit();
            console.log(`Successfully deleted video ${videoId} and all associated data.`);
        } catch (error) {
            console.error("Error deleting video and associated data:", error);
        }
    };

    performDelete();
}
