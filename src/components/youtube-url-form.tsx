"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Youtube } from "lucide-react";
import { useEffect } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z.object({
  url: z.string().optional(),
});

type YoutubeUrlFormProps = {
  onUrlChange: (url: string) => void;
};


export function YoutubeUrlForm({ onUrlChange }: YoutubeUrlFormProps) {
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      url: "",
    },
  });

  const urlValue = form.watch('url');

  useEffect(() => {
    const handler = setTimeout(() => {
        onUrlChange(urlValue || '');
    }, 500); // Debounce input

    return () => {
        clearTimeout(handler);
    };
  }, [urlValue, onUrlChange]);


  return (
    <Form {...form}>
      <form className="flex flex-col w-full items-center gap-3">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Enter YouTube URL..." 
                    className="pl-10"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
