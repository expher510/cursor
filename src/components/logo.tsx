import { BookHeart } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline text-primary">
      <BookHeart className="h-7 w-7 text-accent" />
      <span>LinguaStream</span>
    </Link>
  );
}
