"use client";

import { Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "~/components/social/avatar-stack";

// Category color palette — shared source of truth for cards and filters
export const CATEGORY_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  art: { bg: "#fff7ed", accent: "#fb923c", text: "#9a3412" },
  tech: { bg: "#f5f3ff", accent: "#a78bfa", text: "#5b21b6" },
  music: { bg: "#fefce8", accent: "#fbbf24", text: "#854d0e" },
  sports: { bg: "#eff6ff", accent: "#60a5fa", text: "#1e3a8a" },
  social: { bg: "#fdf2f8", accent: "#f472b6", text: "#9d174d" },
  career: { bg: "#ecfdf5", accent: "#34d399", text: "#065f46" },
  "free-food": { bg: "#fef2f2", accent: "#f87171", text: "#991b1b" },
};

const DEFAULT_COLOR = { bg: "#f9fafb", accent: "#9ca3af", text: "#374151" };

export function getCategoryColor(tags: string[]) {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
  }
  return DEFAULT_COLOR;
}

export interface EventCardProps {
  id: string;
  title: string;
  orgId?: string | null;
  orgName?: string | null;
  datetime: string;
  location: string;
  tags: string[];
  flyerUrl?: string | null;
  rsvpCount: number;
  friendsAttending: { id: string; displayName: string; avatarUrl?: string | null }[];
  isSaved: boolean;
  onSaveToggle?: () => void;
  onShare?: () => void;
}

export function EventCard({
  id,
  title,
  orgId,
  orgName,
  datetime,
  location,
  tags,
  flyerUrl,
  rsvpCount,
  friendsAttending,
  isSaved,
  onSaveToggle,
  onShare,
}: EventCardProps) {
  const color = getCategoryColor(tags);

  return (
    <Link href={`/events/${id}`} className="group">
      <div
        className="rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full"
        style={{ background: color.bg }}
      >
        {/* Image / Color area */}
        <div className="h-40 w-full relative overflow-hidden">
          {flyerUrl ? (
            <img src={flyerUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: `${color.accent}40` }} />
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <p
            className="text-sm font-semibold leading-tight line-clamp-2"
            style={{ color: color.text }}
          >
            {title}
          </p>
          {orgName && (
            <p className="text-xs mt-0.5 opacity-70" style={{ color: color.text }}>
              {orgId ? (
                <Link
                  href={`/orgs/${orgId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {orgName}
                </Link>
              ) : (
                orgName
              )}
            </p>
          )}
          <p className="text-xs mt-1 opacity-60" style={{ color: color.text }}>
            {datetime}
          </p>
          <p className="text-xs opacity-50" style={{ color: color.text }}>
            {location}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: `${color.accent}30`,
                    color: color.text,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-3">
            <div className="flex items-center gap-2">
              {friendsAttending.length > 0 && <AvatarStack users={friendsAttending} size={22} />}
              {rsvpCount > 0 && (
                <span className="text-[10px] opacity-60" style={{ color: color.text }}>
                  {rsvpCount} going
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onShare?.();
                }}
                className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
              >
                <Share2 size={13} className="text-gray-400" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSaveToggle?.();
                }}
                className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
              >
                {isSaved ? (
                  <BookmarkCheck size={13} className="text-blue-500" />
                ) : (
                  <Bookmark size={13} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
