import { AudioWaveform } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-3xl font-bold font-headline text-primary px-2">
      <AudioWaveform className="h-10 w-10" />
      <span>LinguaStream</span>
    </Link>
  );
}
