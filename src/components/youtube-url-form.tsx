"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Youtube } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { extractYouTubeVideoId } from "@/lib/utils";

const FormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
});

export function YoutubeUrlForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      url: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const videoId = extractYouTubeVideoId(data.url);
    if (videoId) {
      router.push(`/watch?v=${videoId}`);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid YouTube URL",
        description: "Could not find a video ID in the provided URL. Please check the link and try again.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-start gap-2">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Enter a YouTube video URL..." 
                    className="pl-10"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Loading..." : "Start Learning"}
        </Button>
      </form>
    </Form>
  );
}
