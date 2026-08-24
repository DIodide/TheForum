"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { type FeedEvent, deleteEvent, toggleRsvp, toggleSave } from "~/actions/events";
import { EmptyState } from "~/components/common/states";
import { EventCard } from "~/components/events/event-card";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { buildGCalUrl } from "~/lib/calendar";

const TABS = [
  {
    id: "created",
    label: "Events Created",
    emptyTitle: "No events created yet",
    emptyBody: "Share something with campus — create your first event.",
  },
  {
    id: "rsvped",
    label: "Events RSVP'd",
    emptyTitle: "No RSVP'd events",
    emptyBody: "Events you've RSVP'd to will show up here.",
  },
  {
    id: "saved",
    label: "Events Saved",
    emptyTitle: "No saved events",
    emptyBody: "Bookmark events you're interested in.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface MyEventsClientProps {
  created: FeedEvent[];
  rsvped: FeedEvent[];
  saved: FeedEvent[];
}

export function MyEventsClient({ created, rsvped, saved }: MyEventsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("created");
  const [lists, setLists] = useState<Record<TabId, FeedEvent[]>>({ created, rsvped, saved });

  /** Update one event wherever it appears across the three tabs. */
  const patchEvent = (eventId: string, patch: Partial<FeedEvent>) => {
    setLists((prev) => {
      const next = {} as Record<TabId, FeedEvent[]>;
      for (const key of Object.keys(prev) as TabId[]) {
        next[key] = prev[key].map((e) => (e.id === eventId ? { ...e, ...patch } : e));
      }
      return next;
    });
  };

  const handleSaveToggle = async (eventId: string) => {
    const result = await toggleSave(eventId);
    patchEvent(eventId, { isSaved: result.saved });
  };

  const handleRsvpToggle = async (eventId: string) => {
    const result = await toggleRsvp(eventId);
    patchEvent(eventId, { isRsvped: result.rsvped, rsvpCount: result.count });
  };

  /*
   * Deleting is irreversible, so it goes through a confirmation rather than
   * firing straight off the card.
   */
  const [pendingDelete, setPendingDelete] = useState<FeedEvent | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { id, title } = pendingDelete;
    startDeleting(async () => {
      await deleteEvent(id);
      setLists((prev) => ({
        created: prev.created.filter((e) => e.id !== id),
        rsvped: prev.rsvped.filter((e) => e.id !== id),
        saved: prev.saved.filter((e) => e.id !== id),
      }));
      setPendingDelete(null);
      toast.success(`Deleted ${title}`);
    });
  };

  const eventMap = lists;

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
      <TabsList variant="line" className="h-auto w-full border-b border-forum-medium-gray">
        {TABS.map(({ id, label }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="flex-1 py-4 font-dm-sans text-[18px] font-semibold after:bottom-[-1px] after:h-0.5 after:bg-forum-cerulean data-[state=active]:text-black"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map(({ id, emptyTitle, emptyBody }) => (
        <TabsContent key={id} value={id} className="mt-6">
          {eventMap[id].length > 0 ? (
            <div className="flex flex-col gap-4">
              {eventMap[id].map((event, index) => (
                <EventCard
                  key={event.id}
                  {...event}
                  density="wide"
                  calendarUrl={
                    event.rawDatetime
                      ? buildGCalUrl({
                          title: event.title,
                          description: event.description,
                          datetime: new Date(event.rawDatetime),
                          endDatetime: null,
                          locationName: event.location,
                        })
                      : undefined
                  }
                  {...(id === "created"
                    ? {
                        editHref: `/events/${event.id}/edit`,
                        onDelete: () => setPendingDelete(event),
                      }
                    : {})}
                  onSaveToggle={() => handleSaveToggle(event.id)}
                  onRsvpToggle={() => handleRsvpToggle(event.id)}
                  onShare={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
                    toast.success("Link copied to clipboard");
                  }}
                  source="feed"
                  position={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState title={emptyTitle} description={emptyBody} />
          )}
        </TabsContent>
      ))}

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete event</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{pendingDelete?.title}&rdquo;. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="coral" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
