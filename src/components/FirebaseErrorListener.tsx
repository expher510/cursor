
'use client';
import { useEffect, useState } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(error.message).then(() => {
      toast({
        title: 'Copied!',
        description: 'Error message copied to clipboard.',
      });
    });
  };

  return (
    <div
      role="alert"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
    >
      <div className="relative w-full max-w-2xl rounded-lg border border-destructive bg-background p-6 shadow-lg">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h2 className="text-xl font-semibold text-destructive">
              Firestore Permission Error
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            The application tried to perform an action that was denied by your
            Firestore Security Rules. Use the information below to update your{' '}
            <code className="rounded bg-muted px-1.5 py-1 text-sm">
              firestore.rules
            </code>{' '}
            file.
          </p>
          <div className="relative rounded-md bg-muted p-4">
            <pre className="whitespace-pre-wrap break-words text-sm text-foreground">
              <code>{error.message}</code>
            </pre>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy error message</span>
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
            >
              Go to Homepage
            </Button>
            <Button variant="secondary" onClick={resetErrorBoundary}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FirebaseErrorListener({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handlePermissionError = (err: FirestorePermissionError) => {
      console.error('Firestore Permission Error Caught:', err);
      setError(err);
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  const resetError = () => setError(null);

  if (error) {
    // When an error is caught, we throw it to let ErrorBoundary handle it.
    // This makes the error visible in Next.js dev overlay.
    throw error;
  }
  
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={resetError}>
      {children}
    </ErrorBoundary>
  );
}
