'use client';

import * as React from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { History, List, LogOut, PlusCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirebase } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { Logo } from './logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { HistoryMenu } from './history-menu';
import { VocabularyList } from './vocabulary-list';

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
    const { auth } = useFirebase();

    const handleLogout = async () => {
        await auth.signOut();
        setOpen(false);
    }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
         <Logo />
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={['history', 'vocabulary']} className="w-full">
          <AccordionItem value="actions">
            <AccordionTrigger className='px-4'>Navigation</AccordionTrigger>
            <AccordionContent>
               <div className='flex flex-col gap-1 px-2'>
                    <MobileLink href="/" onOpenChange={setOpen} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                        <PlusCircle className="w-5 h-5" />
                        <span>New Video</span>
                    </MobileLink>
                    <button onClick={handleLogout} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted w-full text-left">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="history">
            <AccordionTrigger className='px-4'>History</AccordionTrigger>
            <AccordionContent className='p-0'>
                <HistoryMenu isMobile={true} onLinkClick={() => setOpen(false)} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="vocabulary">
            <AccordionTrigger className='px-4'>Vocabulary</AccordionTrigger>
            <AccordionContent className='p-0'>
                <VocabularyList isSheet={true} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
}
