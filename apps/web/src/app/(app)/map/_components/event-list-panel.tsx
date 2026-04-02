"use client";

import { Clock, MapPin, Maximize2, X } from "lucide-react";
import Link from "next/link";
import type { MapEvent } from "~/actions/map";
import { cn } from "~/lib/utils";
import { URGENCY_STYLES, getEventColor, getRelativeLabel } from "../_lib/map-helpers";

interface EventListPanelProps {
  events: MapEvent[];
  selectedLocation: string | null;
  onLocateEvent: (event: MapEvent) => void;
  onExpandEvent: (eventId: string) => void;
  onClose: () => void;
}

export function EventListPanel({
  events,
  selectedLocation,
  onLocateEvent,
  onExpandEvent,
  onClose,
}: EventListPanelProps) {
  return (
    <div className="flex flex-col h-full w-[380px]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Event cards */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MapPin size={20} className="text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">No events found</p>
            <p className="text-xs text-gray-400 mt-0.5">Try adjusting your filters</p>
          </div>
        )}

        {events.map((event) => (
          <PanelEventCard
            key={event.id}
            event={event}
            isActive={selectedLocation === event.locationId}
            onLocate={() => onLocateEvent(event)}
            onExpand={() => onExpandEvent(event.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PanelEventCard({
  event,
  isActive,
  onLocate,
  onExpand,
}: {
  event: MapEvent;
  isActive: boolean;
  onLocate: () => void;
  onExpand: () => void;
}) {
  const color = getEventColor(event.tags);
  const rel = getRelativeLabel(event.rawDatetime);
  const urgency = URGENCY_STYLES[rel.urgency];
  const eventDate = new Date(event.rawDatetime);

  return (
    <button
      type="button"
      className={cn(
        "w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer",
        isActive && "bg-sky-50/50 border-l-2 border-l-sky-400",
      )}
      onClick={onLocate}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 leading-tight truncate">{event.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {eventDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <p className="text-xs text-gray-500">
            {eventDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
            {" - "}
            {new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {event.tags.slice(0, 3).map((tag) => {
            const tagColor = getEventColor([tag]);
            return (
              <span
                key={tag}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
              >
                {tag.replace(/-/g, " ")}
              </span>
            );
          })}
        </div>
      )}

      {/* Org */}
      {event.orgName && <p className="text-[11px] text-gray-400 mt-1 truncate">{event.orgName}</p>}
    </button>
  );
}
