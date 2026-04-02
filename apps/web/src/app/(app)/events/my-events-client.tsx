"use client";

import { Clock, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { FeedEvent } from "~/actions/events";
import { getCategoryColor } from "~/components/events/event-card";
import { EventCoverArt } from "~/components/events/event-cover-art";
import { cn } from "~/lib/utils";

const TABS = [
  { id: "created", label: "Events Created" },
  { id: "saved", label: "Events Saved" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface MyEventsClientProps {
  created: FeedEvent[];
  rsvped: FeedEvent[];
  saved: FeedEvent[];
}

function EventListCard({ event }: { event: FeedEvent }) {
  const color = getCategoryColor(event.tags);

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex gap-[16px] p-[12px] rounded-[10px] hover:bg-forum-turquoise/5 transition-colors"
    >
      {/* Flyer thumbnail */}
      <div className="w-[200px] h-[140px] rounded-[10px] overflow-hidden flex-shrink-0">
        {event.flyerUrl ? (
          <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <EventCoverArt
            title={event.title}
            tags={event.tags}
            className="w-full h-full rounded-[10px]"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="font-serif text-[20px] text-black leading-tight line-clamp-2 mb-[8px]">
          {event.title}
        </h3>

        <div className="flex items-center gap-[6px] mb-[4px]">
          <Clock size={13} className="text-forum-dark-gray flex-shrink-0" />
          <span className="text-[14px] font-dm-sans text-forum-dark-gray">{event.datetime}</span>
        </div>

        <div className="flex items-center gap-[6px] mb-[8px]">
          <MapPin size={13} className="text-forum-dark-gray flex-shrink-0" />
          <span className="text-[14px] font-dm-sans text-forum-dark-gray">{event.location}</span>
        </div>

        {event.tags.length > 0 && (
          <div className="flex gap-[8px] flex-wrap mt-auto">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-[10px] py-[2px] rounded-[15px] text-[13px] font-dm-sans text-black bg-forum-yellow-50"
              >
                {tag}
              </span>
            ))}
            {event.orgName && (
              <span className="px-[10px] py-[2px] rounded-[15px] text-[13px] font-dm-sans text-black bg-forum-turquoise-50">
                {event.orgName}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function MyEventsClient({ created, rsvped, saved }: MyEventsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("created");

  const eventMap: Record<TabId, FeedEvent[]> = { created, saved };
  const events = eventMap[activeTab];

  return (
    <div>
      {/* Tab bar */}
      <div className="relative mb-[24px]">
        <div className="bg-white rounded-[10px] shadow-[0px_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="flex">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex-1 py-[16px] text-[18px] font-dm-sans font-semibold transition-colors relative",
                  activeTab === id
                    ? "text-black"
                    : "text-forum-light-gray hover:text-forum-dark-gray",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Active indicator line */}
          <div className="h-[2px] bg-forum-medium-gray relative">
            <div
              className="absolute h-[2px] bg-forum-cerulean transition-all duration-300"
              style={{
                width: `${100 / TABS.length}%`,
                left: `${(TABS.findIndex((t) => t.id === activeTab) * 100) / TABS.length}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Event list */}
      {events.length > 0 ? (
        <div className="flex flex-col gap-[16px]">
          {events.map((event) => (
            <EventListCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-[60px]">
          <p className="font-serif text-[24px] text-forum-dark-gray mb-[8px]">
            {activeTab === "created" ? "No events created yet" : "No saved events"}
          </p>
          <p className="text-[14px] font-dm-sans text-forum-light-gray mb-[24px]">
            {activeTab === "created"
              ? "Share something with campus — create your first event."
              : "Bookmark events you're interested in."}
          </p>
        </div>
      )}

      {/* Create Event button */}
      <div className="flex justify-center mt-[30px]">
        <Link
          href="/events/create"
          className="flex items-center justify-center gap-[8px] h-[42px] px-[40px] rounded-[10px] bg-black text-white font-dm-sans font-bold text-[14px] tracking-wider hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          CREATE AN EVENT
        </Link>
      </div>
    </div>
  );
}
