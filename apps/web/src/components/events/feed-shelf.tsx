"use client";

import type { ExploreShelf, FeedEvent } from "~/actions/events";
import { EventCard } from "~/components/events/event-card";
import { Badge } from "~/components/ui/badge";

interface FeedShelfProps {
  section: ExploreShelf;
  onSaveToggle: (event: FeedEvent, shelfId: string) => void;
  onShare: (event: FeedEvent, shelfId: string) => void;
  onDismiss: (event: FeedEvent, shelfId: string) => void;
  onOpen: (event: FeedEvent, shelfId: string) => void;
}

export function FeedShelf({ section, onSaveToggle, onShare, onDismiss, onOpen }: FeedShelfProps) {
  if (section.events.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-500">
              {section.events.length} picks
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">{section.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {section.events.map((event) => (
          <EventCard
            key={event.id}
            {...event}
            onOpen={() => onOpen(event, section.id)}
            onDismiss={() => onDismiss(event, section.id)}
            onSaveToggle={() => onSaveToggle(event, section.id)}
            onShare={() => onShare(event, section.id)}
          />
        ))}
      </div>
    </section>
  );
}
