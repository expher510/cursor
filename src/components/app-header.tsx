import { SidebarTrigger } from "./ui/sidebar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm lg:px-6">
      <SidebarTrigger className="flex md:hidden"/>
      <div className="flex-1">
        {/* Placeholder for potential header content like page title or breadcrumbs */}
      </div>
    </header>
  );
}
