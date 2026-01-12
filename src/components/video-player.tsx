import { Card, CardContent } from "@/components/ui/card";
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';


type VideoPlayerProps = {
  videoId: string;
  title: string;
};

export function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
            <LiteYouTubeEmbed
                id={videoId}
                title={title}
                params="modestbranding=1&rel=0"
                noCookie={true}
            />
        </div>
      </CardContent>
    </Card>
  );
}
