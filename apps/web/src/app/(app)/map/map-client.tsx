"use client";

import { Building2, CalendarDays, Home, LogOut, Map as MapIcon, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { type MapEvent, getMapEvents } from "~/actions/map";
import { cn } from "~/lib/utils";
import { getTimeGroup } from "./_lib/map-helpers";

/* Dynamic import for MapView — mapbox-gl accesses `window` at module init */
const MapView = dynamic(
  () => import("./_components/map-view").then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-gray-200 flex items-center justify-center z-40">
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-sky-500 animate-spin" />
          <span className="text-xs text-gray-400 font-medium">Loading map</span>
        </div>
      </div>
    ),
  },
);

/* Lazy-load overlay components */
const MapSearchBar = dynamic(
  () => import("./_components/map-search-bar").then((m) => ({ default: m.MapSearchBar })),
  { ssr: false },
);
const MapFilterPills = dynamic(
  () => import("./_components/map-filter-pills").then((m) => ({ default: m.MapFilterPills })),
  { ssr: false },
);
const TimelineScrubber = dynamic(
  () => import("./_components/timeline-scrubber").then((m) => ({ default: m.TimelineScrubber })),
  { ssr: false },
);
const EventListPanel = dynamic(
  () => import("./_components/event-list-panel").then((m) => ({ default: m.EventListPanel })),
  { ssr: false },
);
const EventDetailModal = dynamic(
  () => import("./_components/event-detail-modal").then((m) => ({ default: m.EventDetailModal })),
  { ssr: false },
);

/* ═══ Filter types ═══ */
export type FilterKey = "friends" | "now" | "attending";

/* ═══ Floating mini-nav items ═══ */
const NAV_ITEMS = [
  { href: "/explore", icon: Home },
  { href: "/events", icon: CalendarDays },
  { href: "/map", icon: MapIcon },
  { href: "/friends", icon: Users },
];

/* ═══ Component ═══ */
interface MapClientProps {
  initialEvents: MapEvent[];
}

export function MapClient({ initialEvents }: MapClientProps) {
  const mapRef = useRef<MapRef>(null);
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  /* Data */
  const [events, setEvents] = useState(initialEvents);

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /* Map interaction */
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  /* Panel / Modal */
  const [panelOpen, setPanelOpen] = useState(false);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);

  /* ═══ Derived state ═══ */
  const filteredEvents = useMemo(() => {
    let result = events;
    if (selectedDate) {
      result = result.filter((e) => e.rawDatetime.startsWith(selectedDate));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.locationName.toLowerCase().includes(q) ||
          e.orgName?.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (activeFilters.has("now")) {
      result = result.filter((e) => getTimeGroup(e.rawDatetime) === "now");
    }
    return result;
  }, [events, selectedDate, searchQuery, activeFilters]);

  const locationGroups = useMemo(() => {
    const groups = new Map<string, MapEvent[]>();
    for (const event of filteredEvents) {
      const group = groups.get(event.locationId);
      if (group) group.push(event);
      else groups.set(event.locationId, [event]);
    }
    return groups;
  }, [filteredEvents]);

  const eventCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const d = event.rawDatetime.slice(0, 10);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return counts;
  }, [events]);

  /* ═══ Callbacks ═══ */
  const toggleFilter = useCallback((key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleSelectDate = useCallback((dateStr: string | null) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
    setSelectedLocation(null);
  }, []);

  const handleExpandEvent = useCallback((eventId: string) => {
    setDetailEventId(eventId);
    setPanelOpen(true);
  }, []);

  const handleLocateEvent = useCallback((event: MapEvent) => {
    setSelectedLocation(event.locationId);
    mapRef.current?.flyTo({
      center: [event.longitude, event.latitude],
      zoom: 17,
      duration: 500,
    });
  }, []);

  return (
    <>
      {/* ═══ FULL-BLEED MAP — covers entire viewport ═══ */}
      <div className="fixed inset-0 z-40">
        {/* Map fills everything */}
        <div className="absolute inset-0">
          <MapView
            ref={mapRef}
            locationGroups={locationGroups}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            onExpandEvent={handleExpandEvent}
          />
        </div>

        {/* ═══ Floating mini-nav (left side) ═══ */}
        <div className="absolute top-4 left-4 z-10 flex flex-col">
          <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-lg shadow-black/10 border border-gray-200/60 flex flex-col overflow-hidden">
            {NAV_ITEMS.map(({ href, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center justify-center w-11 h-11 transition-colors",
                    isActive ? "bg-[#A2EFF0]/40 text-gray-900" : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <Icon size={20} strokeWidth={1.8} />
                </Link>
              );
            })}
          </div>
          {/* Log out button */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-2 flex items-center justify-center w-11 h-11 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg shadow-black/10 border border-gray-200/60 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* ═══ Search bar + filter pills (top center) ═══ */}
        <div className="absolute top-4 left-20 right-4 z-10 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-2 max-w-2xl mx-auto">
            <MapSearchBar value={searchQuery} onChange={setSearchQuery} />
            <MapFilterPills activeFilters={activeFilters} onToggle={toggleFilter} />
          </div>
        </div>

        {/* ═══ Right-side event list panel (floating overlay) ═══ */}
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 z-10 transition-transform duration-300 ease-out",
            panelOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="h-full w-[360px] bg-white/95 backdrop-blur-xl shadow-[-4px_0_20px_rgba(0,0,0,0.08)]">
            <EventListPanel
              events={filteredEvents}
              selectedLocation={selectedLocation}
              onLocateEvent={handleLocateEvent}
              onExpandEvent={handleExpandEvent}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        </div>

        {/* ═══ Timeline scrubber (bottom, full width) ═══ */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <TimelineScrubber
            days={14}
            eventCountByDate={eventCountByDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
        </div>

        {/* ═══ Loading overlay ═══ */}
        {isPending && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] flex items-center justify-center z-20 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/92 backdrop-blur-md shadow-lg border border-gray-200/60">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-600">Loading events</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Event detail modal ═══ */}
      <EventDetailModal eventId={detailEventId} onClose={() => setDetailEventId(null)} />
    </>
  );
}
