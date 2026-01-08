
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  initiateEmailSignUp,
  initiateGoogleSignIn,
} from '@/firebase/non-blocking-login';
import { useFirebase } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const FormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

function GoogleIcon() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.636,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
      </svg>
    );
}

export default function SignUpPage() {
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      const from = searchParams.get('from') || '/';
      router.replace(from);
    }
  }, [user, isUserLoading, router, searchParams]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!auth) return;
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await initiateEmailSignUp(auth, data.email, data.password);
      // Let the useEffect handle redirection
    } catch (error: any) {
      console.error("Sign up error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('This email is already in use. Please log in or use a different email.');
      } else {
        setAuthError('An unexpected error occurred during sign up. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsSubmitting(true);
    setAuthError(null);
     try {
      await initiateGoogleSignIn(auth);
      // Let the useEffect handle redirection
    } catch (error: any) {
        console.error("Google sign in error:", error);
        if (error.code !== 'auth/popup-closed-by-user') {
             setAuthError("Failed to sign in with Google. Please try again.");
        }
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading || (!isUserLoading && user)) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }


  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <Image src="https://picsum.photos/seed/signup/150/150" alt="Learning" width={100} height={100} className="mx-auto rounded-full" data-ai-hint="woman reading" />
          <CardTitle className="text-3xl font-bold font-headline">Create an Account</CardTitle>
          <CardDescription>
            Join our community to start your language learning journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Enter your email"
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          className="pl-10 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {authError && (
                <p className="text-sm font-medium text-destructive">{authError}</p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </Form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                <GoogleIcon />
                <span className="ml-2">Sign Up with Google</span>
            </Button>
            
            <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Log In
                </Link>
            </p>

        </CardContent>
      </Card>
    </main>
  );
}
