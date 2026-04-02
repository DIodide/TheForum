"use client";

import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { NotificationDropdown } from "~/components/layout/notification-dropdown";

export function TopBar() {
  const { data: session } = useSession();
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="flex items-center justify-end gap-4 px-6 py-3 flex-shrink-0">
      <div className="flex items-center gap-3">
        <NotificationDropdown />
        <Link href="/settings">
          <div className="rounded-full bg-forum-cerulean text-white flex items-center justify-center font-bold w-10 h-10 text-[14px] hover:opacity-90 transition-opacity">
            {initial}
          </div>
        </Link>
      </div>
    </header>
  );
}
