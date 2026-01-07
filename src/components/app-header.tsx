"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { Menu, Copy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AppHeader({ children, showBackButton = false }: { children?: React.ReactNode, showBackButton?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2 md:gap-4">
            {showBackButton ? (
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                 </Button>
            ) : (
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                    >
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="pr-0 md:hidden">
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                    <MobileNav setOpen={setOpen} />
                  </SheetContent>
                </Sheet>
            )}
        </div>
        
        <div className="flex-1 flex items-center justify-center">
           <Logo />
           <div className="hidden md:flex">{children}</div>
        </div>
        
        <nav className="flex items-center justify-end gap-2" style={{minWidth: '60px'}}>
            <Button asChild variant="default" className="gap-2">
                <Link href="/flashcards">
                    <Copy className="h-5 w-5" />
                    <span className="hidden sm:inline">Flashcards</span>
                </Link>
            </Button>
        </nav>
      </div>
       <div className="md:hidden flex justify-center pb-2">
          {children}
       </div>
    </header>
  );
}
