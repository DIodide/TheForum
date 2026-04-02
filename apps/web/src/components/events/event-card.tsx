"use client";

import { Bookmark, BookmarkCheck, Clock, Expand, EyeOff, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { logInteraction } from "~/actions/interactions";
import { EventCoverArt } from "~/components/events/event-cover-art";
import { AvatarStack } from "~/components/social/avatar-stack";

export const CATEGORY_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  art: { bg: "rgba(255,156,133,0.1)", accent: "#fb923c", text: "#9a3412" },
  tech: { bg: "rgba(162,239,240,0.15)", accent: "#a78bfa", text: "#5b21b6" },
  music: { bg: "rgba(254,232,130,0.15)", accent: "#fbbf24", text: "#854d0e" },
  sports: { bg: "rgba(162,239,240,0.15)", accent: "#60a5fa", text: "#1e3a8a" },
  social: { bg: "rgba(255,211,234,0.2)", accent: "#f472b6", text: "#9d174d" },
  career: { bg: "rgba(162,239,240,0.15)", accent: "#34d399", text: "#065f46" },
  "free-food": { bg: "rgba(255,156,133,0.1)", accent: "#FF7151", text: "#991b1b" },
  academic: { bg: "rgba(162,239,240,0.15)", accent: "#0A9CD5", text: "#0c4a6e" },
  cultural: { bg: "rgba(254,232,130,0.15)", accent: "#f59e0b", text: "#78350f" },
  workshop: { bg: "rgba(162,239,240,0.15)", accent: "#14b8a6", text: "#134e4a" },
};

const DEFAULT_COLOR = { bg: "rgba(255,156,133,0.1)", accent: "#D9D9D9", text: "#585858" };

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
  orgLogoUrl?: string | null;
  datetime: string;
  location: string;
  description?: string | null;
  tags: string[];
  flyerUrl?: string | null;
  rsvpCount: number;
  friendsAttending: { id: string; displayName: string; avatarUrl?: string | null }[];
  isSaved: boolean;
  isRsvped?: boolean;
  onSaveToggle?: () => void;
  onRsvpToggle?: () => void;
  onShare?: () => void;
  onHide?: () => void;
  /** Where this card is displayed — logged with interactions */
  source?: "feed" | "search" | "map" | "similar" | "notification";
  /** Position in the list — for position bias correction */
  position?: number;
}

export function EventCard({
  id,
  title,
  orgId,
  orgName,
  orgLogoUrl,
  datetime,
  location,
  description,
  tags,
  flyerUrl,
  rsvpCount,
  friendsAttending,
  isSaved,
  isRsvped,
  onSaveToggle,
  onRsvpToggle,
  onShare,
  onHide,
  source = "feed",
  position,
}: EventCardProps) {
  const color = getCategoryColor(tags);
  const cardRef = useRef<HTMLDivElement>(null);

  // Track view — IntersectionObserver fires after 1s of visibility
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          logInteraction({ itemId: id, interactionType: "view", metadata: { source, position } });
          observer.disconnect(); // only log once per mount
        }
      },
      { threshold: 0.5 },
    );
    // Delay observation by 1s to avoid scroll-by noise
    const timer = setTimeout(() => observer.observe(el), 1000);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [id, source, position]);

  const trackClick = () => {
    logInteraction({ itemId: id, interactionType: "click", metadata: { source, position } });
  };

  return (
    <div
      ref={cardRef}
      className="rounded-[16px] overflow-hidden relative group"
      style={{ background: color.bg }}
    >
      {/* Expand + Hide */}
      <div className="absolute top-[10px] right-[10px] z-10 flex items-center gap-[4px]">
        {onHide && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              logInteraction({
                itemId: id,
                interactionType: "hide",
                metadata: { source, position },
              });
              onHide();
            }}
            className="text-forum-medium-gray hover:text-forum-coral transition-colors p-[2px] rounded-full hover:bg-white/50"
            title="Not interested"
          >
            <EyeOff size={14} />
          </button>
        )}
        <Link
          href={`/events/${id}`}
          onClick={trackClick}
          className="text-forum-medium-gray hover:text-forum-dark-gray transition-colors"
        >
          <Expand size={16} />
        </Link>
      </div>

      <div className="flex p-[24px] pb-0 gap-[16px]">
        {/* Flyer */}
        <div className="w-[140px] h-[150px] rounded-[14px] flex-shrink-0 overflow-hidden">
          {flyerUrl ? (
            <img src={flyerUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <EventCoverArt title={title} tags={tags} className="w-full h-full" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-[8px] flex-1 min-w-0">
          {/* Save & Share */}
          <div className="flex items-center gap-[6px]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                logInteraction({
                  itemId: id,
                  interactionType: "save",
                  metadata: { source, position },
                });
                onSaveToggle?.();
              }}
              className="p-0.5 hover:opacity-70 transition-opacity"
            >
              {isSaved ? (
                <BookmarkCheck size={15} className="text-forum-cerulean" />
              ) : (
                <Bookmark size={15} className="text-forum-medium-gray" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                logInteraction({
                  itemId: id,
                  interactionType: "share",
                  metadata: { source, position },
                });
                onShare?.();
              }}
              className="p-0.5 hover:opacity-70 transition-opacity"
            >
              <Share2 size={13} className="text-forum-medium-gray" />
            </button>
          </div>

          {/* Title */}
          <Link href={`/events/${id}`} onClick={trackClick}>
            <h3 className="font-serif text-[18px] leading-[1.2] text-black line-clamp-2 hover:underline">
              {title}
            </h3>
          </Link>

          {/* Org */}
          {orgName && (
            <div className="flex items-center gap-[8px]">
              <div className="w-[24px] h-[24px] rounded-[4px] border-[2px] border-forum-medium-gray overflow-hidden flex-shrink-0 bg-gray-100">
                {orgLogoUrl ? (
                  <img src={orgLogoUrl} alt={orgName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-forum-turquoise/30" />
                )}
              </div>
              <p className="text-[12px] text-forum-dark-gray">
                <span className="font-medium">from </span>
                {orgId ? (
                  <Link
                    href={`/orgs/${orgId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold hover:underline"
                  >
                    {orgName}
                  </Link>
                ) : (
                  <span className="font-bold">{orgName}</span>
                )}
              </p>
            </div>
          )}

          {/* Location & Time */}
          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center gap-[5px]">
              <MapPin size={11} className="text-forum-dark-gray flex-shrink-0" />
              <span className="text-[12px] text-forum-dark-gray">{location}</span>
            </div>
            <div className="flex items-center gap-[5px]">
              <Clock size={11} className="text-forum-dark-gray flex-shrink-0" />
              <span className="text-[12px] text-forum-dark-gray">{datetime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="mx-[24px] mt-[8px] rounded-[12px] overflow-hidden">
          <p className="text-[12px] text-black font-dm-sans leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      )}

      {/* Bottom: Tags + RSVP */}
      <div className="flex items-center justify-between px-[24px] py-[12px]">
        <div className="flex items-center gap-[6px] flex-wrap">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-[8px] py-[1px] rounded-[10px] text-[12px] font-dm-sans text-black"
              style={{ background: "rgba(254,232,130,0.5)" }}
            >
              {tag}
            </span>
          ))}
          {friendsAttending.length > 0 && (
            <div className="ml-1">
              <AvatarStack users={friendsAttending} size={20} />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            logInteraction({ itemId: id, interactionType: "rsvp", metadata: { source, position } });
            onRsvpToggle?.();
          }}
          className={`px-[10px] py-[6px] rounded-[8px] text-[12px] font-bold font-dm-sans transition-colors ${
            isRsvped
              ? "bg-forum-dark-gray text-white"
              : "bg-forum-coral text-white hover:opacity-90"
          }`}
        >
          {isRsvped ? "RSVP'D" : "RSVP NOW"}
        </button>
      </div>
    </div>
  );
}
