'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/hooks/use-user-profile';

const OnboardingSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  nativeLanguage: z.string({ required_error: 'Please select your native language.' }),
  targetLanguage: z.string({ required_error: 'Please select a language to learn.' }),
  proficiencyLevel: z.string({ required_error: 'Please select your level.' }),
  learningGoal: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof OnboardingSchema>;

type OnboardingModalProps = {
  open: boolean;
  onSave: (data: OnboardingFormValues) => Promise<void>;
  isEditMode?: boolean;
  initialData?: Partial<UserProfile>;
  onOpenChange?: (open: boolean) => void;
};

export function OnboardingModal({ open, onSave, isEditMode = false, initialData, onOpenChange }: OnboardingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      displayName: initialData?.displayName || '',
      nativeLanguage: initialData?.nativeLanguage || undefined,
      targetLanguage: initialData?.targetLanguage || undefined,
      proficiencyLevel: initialData?.proficiencyLevel || undefined,
      learningGoal: initialData?.learningGoal || '',
    },
  });
  
  useEffect(() => {
    if (initialData) {
      form.reset({
        displayName: initialData.displayName || '',
        nativeLanguage: initialData.nativeLanguage || undefined,
        targetLanguage: initialData.targetLanguage || undefined,
        proficiencyLevel: initialData.proficiencyLevel || undefined,
        learningGoal: initialData.learningGoal || '',
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsSubmitting(true);
    await onSave(data);
    // The parent component will handle closing the modal after the save is complete.
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" onInteractOutside={(e) => { if (!isEditMode) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="text-2xl">{isEditMode ? 'Update Your Profile' : 'Welcome to LinguaStream!'}</DialogTitle>
          <DialogDescription>
             {isEditMode ? 'Make changes to your learning preferences below.' : "Let's personalize your learning experience. Tell us a bit about yourself."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What should we call you?</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="nativeLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>My native language is...</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="zh">Chinese (Mandarin)</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ru">Russian</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I want to learn...</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="zh">Chinese (Mandarin)</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ru">Russian</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proficiencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>My level is...</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="learningGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>My learning goal is... (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'To have a conversation with native speakers' or 'To watch movies without subtitles'"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Get Started'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
