"use client";

import { Building2, CalendarDays, Home, LogOut, Map as MapIcon, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

const NAV_ITEMS = [
  { href: "/explore", icon: Home, label: "Home" },
  { href: "/events", icon: CalendarDays, label: "My Events" },
  { href: "/map", icon: MapIcon, label: "Map" },
  { href: "/friends", icon: Users, label: "My Friends" },
  { href: "/orgs", icon: Building2, label: "Orgs" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-48 h-full flex-shrink-0 py-6 bg-[#0f172a]">
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors",
                isActive
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
              )}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-3 px-7 py-3 text-sm text-slate-400 hover:text-slate-200 transition-colors w-full"
      >
        <LogOut size={16} strokeWidth={1.8} />
        Log Out
      </button>
    </aside>
  );
}
