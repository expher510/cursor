import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { AuthProvider } from '@/components/auth-provider';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans' });


export const metadata: Metadata = {
  title: 'LinguaStream',
  description: 'Learn languages with YouTube videos',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-body antialiased`}>
        <FirebaseClientProvider>
          <div className="flex min-h-screen w-full flex-col">
            <AuthProvider>
              {children}
            </AuthProvider>
          </div>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
