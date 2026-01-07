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

export async function deleteVideoAndAssociatedData(firestore: Firestore, userId: string, videoId: string): Promise<void> {
    if (!firestore || !userId || !videoId) {
        console.error("Missing required parameters for deletion.");
        return;
    }

    try {
        const batch = writeBatch(firestore);

        // 1. Delete the main video document
        const videoDocRef = doc(firestore, `users/${userId}/videos/${videoId}`);
        batch.delete(videoDocRef);

        // 2. Delete the transcript document
        const transcriptDocRef = doc(firestore, `users/${userId}/videos/${videoId}/transcripts/${videoId}`);
        batch.delete(transcriptDocRef);

        // 3. Commit the batch
        await batch.commit();
        console.log(`Successfully deleted video ${videoId} and its transcript.`);
    } catch (error) {
        console.error("Error deleting video and associated data:", error);
        // Optionally, re-throw or handle the error in the UI
        throw error;
    }
}
