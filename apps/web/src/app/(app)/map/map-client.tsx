"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { type MapEvent, getMapEvents } from "~/actions/map";
import { getTimeGroup, toDateStr } from "./_lib/map-helpers";
import type { TimeGroup } from "./_lib/map-types";

/* Dynamic import for MapView — mapbox-gl accesses `window` at module init */
const MapView = dynamic(
  () => import("./_components/map-view").then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
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

/* ═══ Component ═══ */
interface MapClientProps {
  initialEvents: MapEvent[];
}

export function MapClient({ initialEvents }: MapClientProps) {
  const mapRef = useRef<MapRef>(null);
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

    // Date filter
    if (selectedDate) {
      result = result.filter((e) => e.rawDatetime.startsWith(selectedDate));
    }

    // Search filter
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

    // Quick filters
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

  const handleSelectLocation = useCallback(
    (locId: string | null) => {
      setSelectedLocation(locId);
      if (locId) {
        // Find events at this location to fly there
        const locEvents = filteredEvents.find((e) => e.locationId === locId);
        if (locEvents) {
          mapRef.current?.flyTo({
            center: [locEvents.longitude, locEvents.latitude],
            zoom: 17,
            duration: 500,
          });
        }
      }
    },
    [filteredEvents],
  );

  const handleLocateEvent = useCallback((event: MapEvent) => {
    setSelectedLocation(event.locationId);
    mapRef.current?.flyTo({
      center: [event.longitude, event.latitude],
      zoom: 17,
      duration: 500,
    });
  }, []);

  const fetchEvents = useCallback((from: string, days: number) => {
    startTransition(async () => {
      const result = await getMapEvents({ from, days });
      setEvents(result);
    });
  }, []);

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-gray-100">
      {/* Main content area (map + timeline stacked vertically) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Map area — fills remaining space */}
        <div className="flex-1 relative">
          {/* Map */}
          <div className="absolute inset-0">
            <MapView
              ref={mapRef}
              locationGroups={locationGroups}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
              onExpandEvent={handleExpandEvent}
            />
          </div>

          {/* Search bar + filter pills overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
            <div className="pointer-events-auto flex flex-col gap-2 max-w-2xl mx-auto">
              <MapSearchBar value={searchQuery} onChange={setSearchQuery} />
              <MapFilterPills activeFilters={activeFilters} onToggle={toggleFilter} />
            </div>
          </div>

          {/* Loading overlay */}
          {isPending && (
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] flex items-center justify-center z-20 pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/92 backdrop-blur-md shadow-lg border border-gray-200/60">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-xs font-medium text-gray-600">Loading events</span>
              </div>
            </div>
          )}
        </div>

        {/* Timeline scrubber (below map, includes legend) */}
        <TimelineScrubber
          days={14}
          eventCountByDate={eventCountByDate}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      </div>

      {/* Right-side event list panel */}
      <div
        className={`transition-all duration-300 ease-out overflow-hidden border-l border-gray-200 bg-white ${
          panelOpen ? "w-[380px]" : "w-0"
        }`}
      >
        <EventListPanel
          events={filteredEvents}
          selectedLocation={selectedLocation}
          onLocateEvent={handleLocateEvent}
          onExpandEvent={handleExpandEvent}
          onClose={() => setPanelOpen(false)}
        />
      </div>

      {/* Event detail modal */}
      <EventDetailModal eventId={detailEventId} onClose={() => setDetailEventId(null)} />
    </div>
  );
}
