"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Barcode,
  Users,
  ArrowRightLeft,
  Banknote,
  CalendarDays,
  FileBarChart,
  Settings,
  Archive,
  ClipboardList,
  UserCog,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Books", href: "/dashboard/books", icon: BookOpen },
  { name: "Book Copies", href: "/dashboard/copies", icon: Library },
  { name: "Barcode Generator", href: "/dashboard/barcodes", icon: Barcode },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Circulation", href: "/dashboard/circulation", icon: ArrowRightLeft },
  { name: "Fines", href: "/dashboard/fines", icon: Banknote },
  { name: "Reservations", href: "/dashboard/reservations", icon: CalendarDays },
  { name: "Inventory", href: "/dashboard/inventory", icon: Archive },
  { name: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  { name: "Acquisitions", href: "/dashboard/acquisitions", icon: ClipboardList },
  { name: "Users & Roles", href: "/dashboard/users", icon: UserCog },
  { name: "Activity Logs", href: "/dashboard/activity", icon: Archive },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-20 items-center border-b border-white/60 px-5">
        <div className="mr-3 flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Library className="size-4" />
        </div>
        <div>
          <span className="block text-sm font-semibold tracking-tight">College Library</span>
          <span className="block text-[11px] text-muted-foreground">Operations desk</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-5">
        <nav className="grid items-start gap-1 px-3 text-sm font-medium">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/65 hover:text-primary",
                  isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

