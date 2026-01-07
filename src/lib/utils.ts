import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  let videoId: string | null = null;
  try {
    // Trim any trailing punctuation that might be accidentally included
    const cleanedUrl = url.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]$/, '');
    const urlObj = new URL(cleanedUrl);
    
    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v");
    }
  } catch (error) {
    // Fallback for non-URL strings or invalid URLs
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    videoId = match ? match[1] : null;
  }
  
  // Final cleanup on the extracted ID
  return videoId ? videoId.split('&')[0] : null;
}
