import { Card, CardContent } from "@/components/ui/card";
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player/youtube'), { ssr: false });

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
                    playerVars: {
                        modestbranding: 1,
                        rel: 0,
                    }
                }}
            />
        </div>
      </CardContent>
    </Card>
  );
}
