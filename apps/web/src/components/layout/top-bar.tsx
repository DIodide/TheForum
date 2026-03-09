"use client";

import { Plus, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationDropdown } from "~/components/layout/notification-dropdown";
import { Button } from "~/components/ui/button";

export function TopBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Search bar */}
      <div className="flex items-center gap-2 flex-1 px-4 py-2 rounded-full bg-[#ede9fe] max-w-[480px]">
        <Search size={14} className="text-purple-600" strokeWidth={2} />
        <input
          type="text"
          placeholder="Search for events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) {
              router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
            }
          }}
          className="bg-transparent text-sm text-purple-900 placeholder:text-purple-400 outline-none flex-1"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Link href="/events/create">
          <Button
            size="sm"
            className="rounded-full bg-blue-500 hover:bg-blue-600 text-white gap-1.5"
          >
            <Plus size={14} strokeWidth={2} />
            Create Event
          </Button>
        </Link>
        <NotificationDropdown />
        <Link href="/settings">
          <div className="rounded-full bg-indigo-400 text-white flex items-center justify-center font-bold w-8 h-8 text-[13px] hover:bg-indigo-500 transition-colors">
            {initial}
          </div>
        </Link>
      </div>
    </header>
  );
}
