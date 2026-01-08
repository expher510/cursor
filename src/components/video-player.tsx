import { Card, CardContent } from "@/components/ui/card";
import ReactPlayer from 'react-player/youtube';

type VideoPlayerProps = {
  videoId: string;
  title: string;
};

export function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
            <ReactPlayer
                url={`https://www.youtube.com/watch?v=${videoId}`}
                width="100%"
                height="100%"
                controls={true}
                playing={true}
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
