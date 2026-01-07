import { Card, CardContent } from "@/components/ui/card";

type VideoPlayerProps = {
  videoId: string;
  title: string;
};

export function VideoPlayer({ videoId, title }: VideoPlayerProps) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold mb-4">{title}</h1>
        <div className="aspect-video w-full overflow-hidden rounded-lg border">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}
