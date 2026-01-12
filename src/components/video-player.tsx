
'use client';
import { Card, CardContent } from "@/components/ui/card";
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { useEffect, useState } from "react";


type VideoPlayerProps = {
  videoId: string;
  title: string;
};

export function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          {isClient && (
            <LiteYouTubeEmbed
                id={videoId}
                title={title}
                params="modestbranding=1&rel=0"
                noCookie={true}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
