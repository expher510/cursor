import { BookHeart } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-xl font-bold font-headline text-primary px-2">
      <BookHeart className="h-6 w-6" />
    </Link>
  );
}
