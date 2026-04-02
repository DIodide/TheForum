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
import { EventCoverArt } from "~/components/events/event-cover-art";
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
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

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
    <div className="max-w-5xl mx-auto px-[40px] py-[20px]">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-[6px] text-[14px] font-dm-sans text-forum-light-gray hover:text-forum-dark-gray transition-colors mb-[24px] group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Main content */}
      <div className="flex gap-[40px]">
        {/* Left: Flyer */}
        <div className="flex-shrink-0 w-[340px]">
          <div className="rounded-[20px] overflow-hidden shadow-xl h-[440px]">
            {event.flyerUrl ? (
              <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <EventCoverArt title={event.title} tags={event.tags} className="w-full h-full" />
            )}
          </div>
        </div>

        {/* Right: Event info */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Action buttons */}
          <div className="flex items-center justify-between mb-[16px]">
            <div className="flex items-center gap-[8px]">
              {event.isOwner && (
                <>
                  <Link href={`/events/${event.id}/edit`}>
                    <button
                      type="button"
                      className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[10px] border border-forum-medium-gray text-[12px] font-bold font-dm-sans text-forum-light-gray hover:border-forum-dark-gray transition-colors"
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  </Link>
                  <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[10px] border border-forum-coral/30 text-[12px] font-bold font-dm-sans text-forum-coral hover:bg-forum-coral/5 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Event</DialogTitle>
                        <DialogDescription>
                          This will permanently delete &ldquo;{event.title}&rdquo;. This cannot be
                          undone.
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
            <div className="flex items-center gap-[8px]">
              <a
                href={buildGCalUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[10px] border border-forum-medium-gray text-[12px] font-bold font-dm-sans text-forum-light-gray hover:border-forum-dark-gray transition-colors"
              >
                <Calendar size={13} /> Calendar
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-[6px] px-[12px] py-[6px] rounded-[10px] border border-forum-medium-gray text-[12px] font-bold font-dm-sans text-forum-light-gray hover:border-forum-dark-gray transition-colors"
              >
                <Share2 size={13} /> Share
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={cn(
                  "flex items-center gap-[6px] px-[12px] py-[6px] rounded-[10px] border text-[12px] font-bold font-dm-sans transition-colors",
                  isSaved
                    ? "text-forum-cerulean border-forum-cerulean bg-forum-turquoise/10"
                    : "text-forum-light-gray border-forum-medium-gray hover:border-forum-dark-gray",
                )}
              >
                {isSaved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                {isSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif text-[36px] font-bold text-black leading-tight mb-[8px]">
            {event.title}
          </h1>

          {/* Org */}
          {event.orgName && (
            <p className="text-[16px] font-dm-sans font-bold text-forum-cerulean mb-[12px]">
              {event.orgName}
            </p>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-[8px] mb-[20px]">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-[10px] py-[2px] rounded-[15px] text-[14px] font-dm-sans text-black bg-forum-yellow-50"
                >
                  {tag}
                </span>
              ))}
              <span
                className={cn(
                  "px-[10px] py-[2px] rounded-[15px] text-[12px] font-bold font-dm-sans",
                  event.isPublic
                    ? "bg-forum-turquoise/20 text-forum-cerulean"
                    : "bg-forum-orange/10 text-forum-orange",
                )}
              >
                {event.isPublic ? "Public" : "Private"}
              </span>
            </div>
          )}

          {/* Details */}
          <div className="space-y-[10px] mb-[20px]">
            <div className="flex items-center gap-[10px] text-[14px] font-dm-sans text-forum-dark-gray">
              <Calendar size={16} className="text-forum-light-gray" />
              {formatDate(event.datetime)}
            </div>
            <div className="flex items-center gap-[10px] text-[14px] font-dm-sans text-forum-dark-gray">
              <Clock size={16} className="text-forum-light-gray" />
              {formatTime(event.datetime)}
              {event.endDatetime && ` - ${formatTime(event.endDatetime)}`}
            </div>
            <div className="flex items-center gap-[10px] text-[14px] font-dm-sans text-forum-dark-gray">
              <MapPin size={16} className="text-forum-light-gray" />
              {event.locationName}
            </div>
            {event.externalLink && (
              <a
                href={event.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[10px] text-[14px] font-dm-sans text-forum-cerulean hover:underline"
              >
                <ExternalLink size={16} /> Register
              </a>
            )}
          </div>

          {/* Description */}
          <p className="text-[14px] font-dm-sans text-forum-dark-gray leading-relaxed whitespace-pre-wrap mb-[24px]">
            {event.description}
          </p>

          {/* RSVP button */}
          <button
            type="button"
            onClick={handleRsvp}
            disabled={isPending}
            className={cn(
              "w-full max-w-[300px] py-[12px] rounded-[10px] font-bold font-dm-sans text-[15px] transition-all",
              isRsvped
                ? "bg-forum-dark-gray text-white"
                : "bg-forum-coral text-white hover:opacity-90",
            )}
          >
            {isRsvped ? "CANCEL RSVP" : "RSVP NOW"}
          </button>

          {/* Attendees */}
          <div className="flex items-center gap-[12px] mt-[16px]">
            {event.attendees.length > 0 && (
              <AvatarStack users={event.attendees} size={30} max={6} />
            )}
            <div>
              <div className="flex items-center gap-[6px]">
                <Users size={14} className="text-forum-light-gray" />
                <span className="text-[14px] font-bold font-dm-sans text-black">
                  {rsvpCount} attending
                </span>
              </div>
              {event.friendsAttending.length > 0 && (
                <p className="text-[12px] font-dm-sans text-forum-light-gray mt-[2px]">
                  {event.friendsAttending.map((f) => f.displayName).join(", ")}{" "}
                  {event.friendsAttending.length === 1 ? "is" : "are"} going
                </p>
              )}
            </div>
          </div>

          <p className="text-[12px] font-dm-sans text-forum-light-gray mt-[20px]">
            Posted by {event.creatorName}
          </p>
        </div>
      </div>

      {/* Similar Events */}
      {similarEvents.length > 0 && (
        <div className="mt-[48px] pt-[24px] border-t border-forum-medium-gray">
          <h2 className="font-serif text-[25px] text-black mb-[20px]">Similar Events</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
            {similarEvents.map((se) => (
              <Link key={se.id} href={`/events/${se.id}`} className="group">
                <div className="rounded-[14px] overflow-hidden bg-forum-coral-bg hover:shadow-md transition-shadow h-[120px] p-[16px] flex flex-col justify-between">
                  <p className="font-serif text-[16px] text-black leading-tight line-clamp-2">
                    {se.title}
                  </p>
                  <p className="text-[12px] font-dm-sans text-forum-light-gray">{se.datetime}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
