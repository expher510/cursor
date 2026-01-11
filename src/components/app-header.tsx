
"use client";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { Menu, Copy, ArrowLeft, LogOut, LogIn, User, Languages } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/firebase";
import { useUserProfile } from "@/hooks/use-user-profile";

const LANGUAGE_MAP: Record<string, string> = {
  ar: 'Arabic',
  zh: 'Chinese (Mandarin)',
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
};

export function AppHeader({ children, showBackButton = false }: { children?: React.ReactNode, showBackButton?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { auth, user } = useFirebase();
  const { userProfile } = useUserProfile();

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };
  
  const userInitial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || <User className="h-5 w-5" />;

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="container flex h-14 items-center">
        <div className="flex items-center justify-start gap-2 md:gap-4" style={{minWidth: '150px'}}>
             {showBackButton ? (
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full ring-1 ring-primary/50" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                 </Button>
            ) : (
                <>
                {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                            <AvatarFallback className="uppercase">{userInitial}</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="start" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                         {userProfile?.nativeLanguage && (
                          <DropdownMenuItem disabled className="cursor-default">
                             <Languages className="mr-2 h-4 w-4" />
                             <span>Native: {LANGUAGE_MAP[userProfile.nativeLanguage] || userProfile.nativeLanguage}</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                  <Button asChild variant="default" className="gap-2">
                      <Link href="/login">
                          <LogIn className="h-5 w-5" />
                          <span className="hidden sm:inline">Login</span>
                      </Link>
                  </Button>
                )}
                </>
            )}
        </div>
        
        <div className="flex-1 flex items-center justify-center">
           <div className="hidden md:flex">{children}</div>
        </div>
        
        <nav className="flex items-center justify-end gap-2" style={{minWidth: '150px'}}>
        </nav>
      </div>
       <div className="md:hidden flex justify-center pb-2">
          {children}
       </div>
    </header>
  );
}
