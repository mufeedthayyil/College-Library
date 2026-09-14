"use client";

import { Bell, Check, Search, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) router.push(`/dashboard?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="relative flex h-16 items-center gap-4 border-b border-white/60 bg-white/30 px-4 backdrop-blur-xl lg:px-8">
      <div className="w-full flex-1">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search books, members, barcodes... (Ctrl+K)"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full appearance-none border-white/70 bg-white/50 pl-9 shadow-none backdrop-blur md:max-w-md"
            />
          </div>
        </form>
      </div>
      <Button variant="outline" size="icon" className="relative size-10 rounded-full" onClick={() => setShowNotifications((visible) => !visible)} aria-label="Toggle notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" />
      </Button>
      {showNotifications && (
        <div className="glass-panel absolute right-20 top-14 z-20 w-72 rounded-2xl p-4 text-sm shadow-xl">
          <div className="flex items-center gap-2 font-medium"><Check className="size-4 text-primary" />All caught up</div>
          <p className="mt-1 text-xs text-muted-foreground">No new circulation alerts.</p>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center rounded-full h-10 w-10 bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <User className="h-5 w-5" />
          <span className="sr-only">Toggle user menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard/users")}>Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>Return to dashboard</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

