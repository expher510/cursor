import { Card, CardContent } from "@/components/ui/card";
import ReactPlayer from 'react-player/youtube';

type VideoPlayerProps = {
  videoId: string;
  title: string;
  onProgress: (state: { played: number, playedSeconds: number, loaded: number, loadedSeconds: number }) => void;
};

export function VideoPlayer({ videoId, title, onProgress }: VideoPlayerProps) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          <ReactPlayer
            url={`https://www.youtube.com/watch?v=${videoId}`}
            width="100%"
            height="100%"
            playing
            controls
            onProgress={onProgress}
            config={{
                youtube: {
                    playerVars: {
                        modestbranding: 1,
                        rel: 0,
                    }
                }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
