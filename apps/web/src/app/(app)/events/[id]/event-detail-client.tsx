"use client";

import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  ChevronLeft,
  Clock,
  Edit3,
  ExternalLink,
  MapPin,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type EventDetail,
  type FeedEvent,
  deleteEvent,
  toggleRsvp,
  toggleSave,
} from "~/actions/events";
import { getCategoryColor } from "~/components/events/event-card";
import { AvatarStack } from "~/components/social/avatar-stack";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

function buildGCalUrl(event: {
  title: string;
  description: string;
  datetime: Date;
  endDatetime: Date | null;
  locationName: string;
}) {
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const start = fmt(event.datetime);
  const end = fmt(event.endDatetime ?? new Date(event.datetime.getTime() + 60 * 60 * 1000));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description,
    location: event.locationName,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface EventDetailClientProps {
  event: EventDetail;
  similarEvents: FeedEvent[];
}

export function EventDetailClient({ event, similarEvents }: EventDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRsvped, setIsRsvped] = useState(event.isRsvped);
  const [isSaved, setIsSaved] = useState(event.isSaved);
  const [rsvpCount, setRsvpCount] = useState(event.rsvpCount);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const color = getCategoryColor(event.tags);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const handleRsvp = () => {
    const prev = isRsvped;
    setIsRsvped(!prev);
    setRsvpCount((c) => (prev ? c - 1 : c + 1));
    startTransition(async () => {
      const result = await toggleRsvp(event.id);
      setIsRsvped(result.rsvped);
      setRsvpCount(result.count);
    });
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    startTransition(async () => {
      const result = await toggleSave(event.id);
      setIsSaved(result.saved);
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      await navigator.share({ title: event.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteEvent(event.id);
      router.push("/explore");
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6 group"
      >
        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex gap-10">
        {/* Left: Flyer */}
        <div className="flex-shrink-0" style={{ width: 340 }}>
          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ height: 440 }}>
            {event.flyerUrl ? (
              <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center p-8"
                style={{
                  background: `linear-gradient(135deg, ${color.bg} 0%, ${color.accent}40 100%)`,
                }}
              >
                <p
                  className="text-3xl font-black leading-tight text-center"
                  style={{ color: color.text }}
                >
                  {event.title}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Event info */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Action buttons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {event.isOwner && (
                <>
                  <Link href={`/events/${event.id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs gap-1.5 border-gray-200 text-gray-500 hover:text-gray-700"
                    >
                      <Edit3 size={12} />
                      Edit
                    </Button>
                  </Link>
                  <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs gap-1.5 border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Event</DialogTitle>
                        <DialogDescription>
                          This will permanently delete &ldquo;{event.title}&rdquo; and remove all
                          RSVPs. This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                          {isPending ? "Deleting..." : "Delete Event"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={buildGCalUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <Calendar size={13} /> Add to Calendar
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <Share2 size={13} /> Share
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={cn(
                  "flex items-center gap-1.5 text-xs border rounded-full px-3 py-1.5 transition-colors",
                  isSaved
                    ? "text-indigo-600 border-indigo-200 bg-indigo-50"
                    : "text-gray-500 border-gray-200 hover:bg-gray-50",
                )}
              >
                {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {isSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">{event.title}</h1>

          {/* Org name */}
          {event.orgName && (
            <p className="text-sm text-indigo-500 font-semibold mb-3">{event.orgName}</p>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-50 text-indigo-600"
                >
                  {tag}
                </span>
              ))}
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full",
                  event.isPublic ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
                )}
              >
                {event.isPublic ? "Public" : "Private"}
              </span>
            </div>
          )}

          {/* Details grid */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar size={15} className="text-gray-400" />
              <span>{formatDate(event.datetime)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock size={15} className="text-gray-400" />
              <span>
                {formatTime(event.datetime)}
                {event.endDatetime && ` - ${formatTime(event.endDatetime)}`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin size={15} className="text-gray-400" />
              <span>{event.locationName}</span>
            </div>
            {event.externalLink && (
              <a
                href={event.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                <ExternalLink size={15} />
                <span className="underline underline-offset-2">Register</span>
              </a>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* RSVP button */}
          <button
            type="button"
            onClick={handleRsvp}
            disabled={isPending}
            className={cn(
              "py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg max-w-sm",
              isRsvped
                ? "bg-white border-2 border-indigo-500 text-indigo-600 shadow-indigo-100"
                : "text-white shadow-indigo-200",
            )}
            style={
              !isRsvped ? { background: "linear-gradient(90deg, #3b82f6, #6366f1)" } : undefined
            }
          >
            {isRsvped ? "Cancel RSVP" : "RSVP"}
          </button>

          {/* Attendees */}
          <div className="flex items-center gap-3 mt-5">
            {event.attendees.length > 0 && (
              <AvatarStack users={event.attendees} size={30} max={6} />
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">{rsvpCount} attending</span>
              </div>
              {event.friendsAttending.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {event.friendsAttending.map((f) => f.displayName).join(", ")}{" "}
                  {event.friendsAttending.length === 1 ? "is" : "are"} going
                </p>
              )}
            </div>
          </div>

          {/* Creator */}
          <p className="text-xs text-gray-400 mt-6">Posted by {event.creatorName}</p>
        </div>
      </div>

      {/* ── Similar Events ──────────────────────────────── */}
      {similarEvents.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">
            Similar Events
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarEvents.map((se) => {
              const seColor = getCategoryColor(se.tags);
              return (
                <Link key={se.id} href={`/events/${se.id}`} className="group">
                  <div
                    className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-32 p-5 flex flex-col justify-between"
                    style={{ background: seColor.bg }}
                  >
                    <p
                      className="text-sm font-bold leading-tight line-clamp-2"
                      style={{ color: seColor.text }}
                    >
                      {se.title}
                    </p>
                    <p className="text-xs opacity-60" style={{ color: seColor.text }}>
                      {se.datetime}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
