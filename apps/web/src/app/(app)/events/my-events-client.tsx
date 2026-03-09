"use client";

import { Bookmark, CalendarDays, Plus, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { FeedEvent } from "~/actions/events";
import { EventCard } from "~/components/events/event-card";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const TABS = [
  { id: "created", label: "Created", icon: CalendarDays },
  { id: "rsvped", label: "RSVP'd", icon: TicketCheck },
  { id: "saved", label: "Saved", icon: Bookmark },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface MyEventsClientProps {
  created: FeedEvent[];
  rsvped: FeedEvent[];
  saved: FeedEvent[];
}

export function MyEventsClient({ created, rsvped, saved }: MyEventsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("created");

  const eventMap: Record<TabId, FeedEvent[]> = { created, rsvped, saved };
  const events = eventMap[activeTab];

  const emptyMessages: Record<TabId, { title: string; desc: string }> = {
    created: {
      title: "No events created yet",
      desc: "Share something with campus — create your first event.",
    },
    rsvped: {
      title: "No RSVPs yet",
      desc: "Browse the feed and RSVP to events you want to attend.",
    },
    saved: {
      title: "Nothing saved yet",
      desc: "Bookmark events you're interested in for later.",
    },
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Icon size={14} />
            {label}
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === id ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500",
              )}
            >
              {eventMap[id].length}
            </span>
          </button>
        ))}
      </div>

      {/* Events grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <CalendarDays size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            {emptyMessages[activeTab].title}
          </h3>
          <p className="text-sm text-gray-400 mb-6 text-center max-w-xs">
            {emptyMessages[activeTab].desc}
          </p>
          {activeTab === "created" && (
            <Link href="/events/create">
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl gap-1.5">
                <Plus size={14} />
                Create Event
              </Button>
            </Link>
          )}
          {activeTab === "rsvped" && (
            <Link href="/explore">
              <Button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl">
                Browse Events
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
