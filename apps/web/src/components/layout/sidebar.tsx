"use client";

import { Building2, CalendarDays, Home, LogOut, Map as MapIcon, Plus, Users } from "lucide-react";
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
    <aside className="flex flex-col w-[200px] h-full flex-shrink-0 rounded-[16px] bg-forum-turquoise-20 shadow-[0px_3px_3px_0px_rgba(32,162,255,0.08)] m-3 mr-0">
      <nav className="flex flex-col gap-[6px] px-[12px] pt-[14px] flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-[10px] px-[10px] py-[8px] rounded-[8px] text-[14px] font-semibold font-dm-sans transition-colors",
                isActive
                  ? "bg-forum-turquoise text-black"
                  : "text-black hover:bg-forum-turquoise/30",
              )}
            >
              <Icon size={20} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}

        <Link
          href="/events/create"
          className="flex items-center gap-[6px] mt-3 px-[10px] py-[8px] rounded-[12px] bg-forum-cerulean text-white font-bold text-[12px] font-dm-sans hover:opacity-90 transition-opacity justify-center"
        >
          <Plus size={15} />
          CREATE AN EVENT
        </Link>
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-[10px] px-[22px] py-[8px] text-[14px] font-semibold font-inter text-forum-light-gray hover:text-forum-dark-gray transition-colors w-full mb-3"
      >
        <LogOut size={18} strokeWidth={1.8} />
        Log Out
      </button>
    </aside>
  );
}
