"use client";

import { Clock, MapPin, X } from "lucide-react";
import { PresetCover } from "~/components/events/cover-presets";
import { EventCoverArt } from "~/components/events/event-cover-art";

interface EventPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  datetime: string;
  endTime: string;
  location: string;
  tags: string[];
  orgName?: string;
  flyerPreview?: string | null;
  coverPreset?: string | null;
}

export function EventPreviewModal({
  open,
  onClose,
  title,
  description,
  datetime,
  endTime,
  location,
  tags,
  orgName,
  flyerPreview,
  coverPreset,
}: EventPreviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close preview"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-[16px] shadow-2xl max-w-[600px] w-full mx-[20px] max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[12px] right-[12px] z-10 p-[6px] rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
        >
          <X size={16} className="text-forum-dark-gray" />
        </button>

        {/* Preview label */}
        <div className="bg-forum-cerulean text-white text-[10px] font-bold tracking-[0.2em] uppercase text-center py-[6px] rounded-t-[16px]">
          Preview — This is how your event will look
        </div>

        {/* Cover */}
        <div className="w-full h-[200px] overflow-hidden">
          {flyerPreview ? (
            <img src={flyerPreview} alt="Cover" className="w-full h-full object-cover" />
          ) : coverPreset ? (
            <PresetCover presetId={coverPreset} className="w-full h-full" />
          ) : (
            <EventCoverArt title={title || "Your Event"} tags={tags} className="w-full h-full" />
          )}
        </div>

        {/* Content */}
        <div className="p-[24px]">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-[6px] mb-[12px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-[8px] py-[1px] rounded-[10px] text-[11px] font-dm-sans text-black bg-forum-yellow-50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="font-serif text-[28px] font-bold text-black leading-tight mb-[8px]">
            {title || "Event Title"}
          </h2>

          {/* Org */}
          {orgName && (
            <p className="text-[13px] font-dm-sans text-forum-dark-gray mb-[12px]">
              <span className="font-medium">from </span>
              <span className="font-bold">{orgName}</span>
            </p>
          )}

          {/* Details */}
          <div className="flex flex-col gap-[6px] mb-[16px]">
            {location && (
              <div className="flex items-center gap-[6px]">
                <MapPin size={13} className="text-forum-light-gray flex-shrink-0" />
                <span className="text-[13px] font-dm-sans text-forum-dark-gray">{location}</span>
              </div>
            )}
            {datetime && (
              <div className="flex items-center gap-[6px]">
                <Clock size={13} className="text-forum-light-gray flex-shrink-0" />
                <span className="text-[13px] font-dm-sans text-forum-dark-gray">
                  {datetime}
                  {endTime ? ` — ${endTime}` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-[13px] font-dm-sans text-forum-dark-gray leading-relaxed whitespace-pre-wrap mb-[20px]">
              {description}
            </p>
          )}

          {/* RSVP button preview */}
          <div className="flex items-center justify-between">
            <div className="flex gap-[6px]">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-[8px] py-[1px] rounded-[10px] text-[11px] font-dm-sans text-black bg-forum-yellow-50"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="px-[14px] py-[8px] rounded-[8px] bg-forum-coral text-white text-[12px] font-bold font-dm-sans">
              RSVP NOW
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
