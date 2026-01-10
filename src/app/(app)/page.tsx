'use client';
import { useState, useRef } from "react";
import { YoutubeUrlForm } from "@/components/youtube-url-form";
import { VideoHistory } from "@/components/video-history";
import { Button } from "@/components/ui/button";
import { Headphones, BookOpen, Edit, Loader2, Youtube, Book, Copy, History, User, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { extractYouTubeVideoId } from "@/lib/utils";
import { useFirebase } from "@/firebase";
import { AppHeader } from "@/components/app-header";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { FlashcardGrid } from "@/components/flashcard-grid";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Skeleton } from "@/components/ui/skeleton";

type ActivityType = 'watch' | 'reading' | 'writing';
type SourceType = 'youtube' | 'cards';

function ActivityButtons({ onActivitySelect, isProcessing, videoId }: { onActivitySelect: (activity: ActivityType) => void, isProcessing: boolean, videoId: string | null }) {
  const isEnabled = !!videoId;

  return (
    <div className="w-full max-w-4xl pt-10 text-left">
       <h2 className="text-2xl font-bold font-headline mb-6 text-center">Choose Your Practice</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => onActivitySelect('watch')}>
            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
            <Headphones className="mr-2" />
            Start Listening
        </Button>
        
        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => onActivitySelect('reading')}>
            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
            <BookOpen className="mr-2" />
            Start Reading
        </Button>

        <Button size="lg" disabled={!isEnabled || isProcessing} onClick={() => onActivitySelect('writing')}>
            {isProcessing && <Loader2 className="mr-2 animate-spin" />}
            <Edit className="mr-2" />
            Start Writing
        </Button>

      </div>
    </div>
  );
}

function MainContent() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const { user } = useFirebase();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>('youtube');
  const cardsContainerRef = useRef<HTMLDivElement>(null);


  const handleUrlChange = (newUrl: string) => {
    const videoId = extractYouTubeVideoId(newUrl);
    setActiveVideoId(videoId);
  };

  const handlePracticeNavigation = async (activity: ActivityType, videoId?: string, shouldGenerate: boolean = true) => {
    const videoIdToUse = videoId || activeVideoId;

    if (!user || !videoIdToUse) {
        toast({ variant: "destructive", title: "No Video Selected", description: "Please enter a URL or select a video from your history." });
        return;
    };
    
    // The responsibility of fetching/checking data is in the WatchPageProvider.
    // This component's only job is to navigate with the correct parameters.
    router.push(`/${activity}?v=${videoIdToUse}&shouldGenerate=${shouldGenerate}`);
  };

  const handleCardsClick = () => {
    setSourceType('cards');
    cardsContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  return (
    <>
      <div className="flex flex-col items-center gap-2 max-w-2xl">
          <Logo />
        <p className="text-muted-foreground md:text-xl">
          Paste a YouTube link below to turn any video into an interactive language lesson.
        </p>
         {isProfileLoading ? (
            <div className="flex items-center gap-4 mt-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
            </div>
          ) : userProfile && (
             <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>Welcome back, {userProfile.displayName}!</span>
                </div>
                {userProfile.proficiencyLevel && (
                    <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="capitalize">{userProfile.proficiencyLevel}</span>
                    </div>
                )}
            </div>
          )}
      </div>
      <div className="w-full max-w-lg pt-4">
          <YoutubeUrlForm onUrlChange={handleUrlChange} />
      </div>

      <ActivityButtons videoId={activeVideoId} isProcessing={isProcessing} onActivitySelect={(activity) => handlePracticeNavigation(activity)} />

      <div className="w-full max-w-4xl pt-10" ref={cardsContainerRef}>
        <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 rounded-full bg-muted p-1">
                <Button variant={sourceType === 'youtube' ? 'outline' : 'ghost'} className={cn("rounded-full", sourceType === 'youtube' && 'bg-background shadow-sm')} onClick={() => setSourceType('youtube')}>
                    <History className="mr-2" />
                    History
                </Button>
                <Button variant={sourceType === 'cards' ? 'outline' : 'ghost'} className={cn("rounded-full", sourceType === 'cards' && 'bg-background shadow-sm')} onClick={() => setSourceType('cards')}>
                    <Copy className="mr-2" />
                    Cards
                </Button>
            </div>
        </div>

        {sourceType === 'youtube' ? (
             <VideoHistory 
                activeVideoId={activeVideoId}
                onVideoSelect={setActiveVideoId}
                onVideoAction={(videoId, activity) => handlePracticeNavigation(activity, videoId, false)}
            />
        ) : (
             <div className="mt-8">
                <FlashcardGrid />
            </div>
        )}
      </div>
    </>
  );
}


export default function HomePage() {
  const { user, isUserLoading } = useFirebase();

  return (
    <>
      <AppHeader />
      <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 pt-24">
        <div className="flex flex-col items-center gap-8 text-center max-w-5xl w-full">
          
          {isUserLoading ? (
            <div className="flex flex-col items-center gap-4 pt-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your experience...</p>
            </div>
          ) : user ? (
            <MainContent />
          ) : (
            <>
                <div className="flex flex-col items-center gap-2 max-w-2xl">
                    <Logo />
                    <p className="text-muted-foreground md:text-xl">
                    Paste a YouTube link below to turn any video into an interactive language lesson.
                    </p>
                </div>
                 <div className="text-center p-8 border-dashed border-2 rounded-lg mt-8">
                    <p className="text-muted-foreground">Please log in or sign up to see your history and start practicing.</p>
                </div>
            </>
          )}

        </div>
      </main>
    </>
  );
}
