'use client';

import * as React from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { History, LogOut, PlusCircle, Copy, BookOpen, Edit, LogIn, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { HistoryMenu } from './history-menu';

interface MobileLinkProps extends LinkProps {
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  href: string;
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: MobileLinkProps) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href);
        onOpenChange?.(false);
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export function MobileNav({ setOpen }: { setOpen: (open: boolean) => void }) {
    const { auth, user } = useFirebase();

    const handleLogout = async () => {
        if (auth) {
            await auth.signOut();
        }
        setOpen(false);
    }
    
    const handleLinkClick = () => {
        setOpen(false);
    }

  return (
    <div className="flex flex-col h-full mt-4">
      <div className="flex flex-col gap-1 p-4 border-b">
        <MobileLink href="/reading" onOpenChange={setOpen} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
          <BookOpen className="w-5 h-5" />
          <span>Reading Practice</span>
        </MobileLink>
        <MobileLink href="/writing" onOpenChange={setOpen} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
          <Edit className="w-5 h-5" />
          <span>Writing Practice</span>
        </MobileLink>
        <MobileLink href="/flashcards" onOpenChange={setOpen} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
          <Copy className="w-5 h-5" />
          <span>Flashcards</span>
        </MobileLink>
         {user ? (
            <button onClick={handleLogout} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted w-full text-left">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
        ) : (
             <MobileLink href="/login" onOpenChange={setOpen} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                <LogIn className="w-5 h-5" />
                <span>Login</span>
            </MobileLink>
        )}
      </div>
      <div className="flex-1">
        <HistoryMenu isMobile={true} onLinkClick={handleLinkClick} />
      </div>
    </div>
  );
}
