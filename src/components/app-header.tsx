"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { Menu, Copy } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useWatchPage } from "@/context/watch-page-context";

function HeaderNotification() {
    const { notification } = useWatchPage();

    return (
        <>
            {notification && (
                <div
                    className="ml-4 text-sm font-medium text-muted-foreground"
                    >
                    {notification}
                </div>
            )}
        </>
    )
}

export function AppHeader() {
  const [open, setOpen] = useState(false);
  
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
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
        
        <div className="hidden md:flex flex-1 items-center justify-start">
           <Logo />
           <HeaderNotification />
        </div>

        <div className="md:hidden flex-1 flex justify-center">
            <Logo />
        </div>
        
        <nav className="flex flex-1 items-center justify-end gap-2">
            <Button asChild variant="default" className="gap-2">
                <Link href="/flashcards">
                    <Copy className="h-5 w-5" />
                    <span className="hidden sm:inline">Flashcards</span>
                </Link>
            </Button>
        </nav>
      </div>
    </header>
  );
}
