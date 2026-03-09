"use client";

import type L from "leaflet";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  MapPin,
  Navigation,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { type MapEvent, getMapEvents } from "~/actions/map";
import { cn } from "~/lib/utils";

/* ═══ react-leaflet (no SSR) ═══ */
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

/* ═══ Tag colors ═══ */
const TAG_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  "free-food": { dot: "#ea580c", bg: "#fff7ed", text: "#c2410c" },
  workshop: { dot: "#7c3aed", bg: "#f5f3ff", text: "#6d28d9" },
  performance: { dot: "#db2777", bg: "#fdf2f8", text: "#be185d" },
  speaker: { dot: "#0891b2", bg: "#ecfeff", text: "#0e7490" },
  social: { dot: "#e11d48", bg: "#fff1f2", text: "#be123c" },
  career: { dot: "#059669", bg: "#ecfdf5", text: "#047857" },
  sports: { dot: "#16a34a", bg: "#f0fdf4", text: "#15803d" },
  music: { dot: "#9333ea", bg: "#faf5ff", text: "#7e22ce" },
  art: { dot: "#ec4899", bg: "#fdf2f8", text: "#db2777" },
  academic: { dot: "#2563eb", bg: "#eff6ff", text: "#1d4ed8" },
  cultural: { dot: "#ca8a04", bg: "#fefce8", text: "#a16207" },
  "community-service": { dot: "#0d9488", bg: "#f0fdfa", text: "#0f766e" },
  religious: { dot: "#7c3aed", bg: "#f5f3ff", text: "#6d28d9" },
  political: { dot: "#dc2626", bg: "#fef2f2", text: "#b91c1c" },
  tech: { dot: "#4f46e5", bg: "#eef2ff", text: "#4338ca" },
  gaming: { dot: "#65a30d", bg: "#f7fee7", text: "#4d7c0f" },
  outdoor: { dot: "#059669", bg: "#ecfdf5", text: "#047857" },
  wellness: { dot: "#d97706", bg: "#fffbeb", text: "#b45309" },
};
const DEFAULT_TAG = { dot: "#64748b", bg: "#f8fafc", text: "#475569" };

function getEventColor(tags: string[]) {
  for (const tag of tags) {
    const c = TAG_COLORS[tag];
    if (c) return c;
  }
  return DEFAULT_TAG;
}

/* ═══ Time helpers ═══ */
type TimeGroup = "now" | "soon" | "later-today" | "tomorrow" | "this-week";

function getTimeGroup(rawDatetime: string): TimeGroup {
  const eventTime = new Date(rawDatetime).getTime();
  const now = Date.now();
  const diffMs = eventTime - now;
  const diffH = diffMs / (1000 * 60 * 60);

  if (diffMs < 0 && diffMs > -2 * 60 * 60 * 1000) return "now";
  if (diffH <= 0) return "later-today";
  if (diffH <= 3) return "soon";

  const eventDay = new Date(rawDatetime);
  const today = new Date();
  eventDay.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return "later-today";
  if (dayDiff === 1) return "tomorrow";
  return "this-week";
}

function getRelativeLabel(rawDatetime: string): { label: string; urgency: TimeGroup } {
  const eventTime = new Date(rawDatetime);
  const now = new Date();
  const diffMs = eventTime.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / (1000 * 60));
  const diffH = Math.round(diffMs / (1000 * 60 * 60));
  const group = getTimeGroup(rawDatetime);

  if (group === "now") return { label: "NOW", urgency: "now" };
  if (diffMin > 0 && diffMin < 60) return { label: `${diffMin}m`, urgency: "soon" };
  if (diffH > 0 && diffH <= 3) return { label: `${diffH}h`, urgency: "soon" };

  const eventDay = new Date(rawDatetime);
  const today = new Date();
  eventDay.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    return {
      label: eventTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      urgency: "later-today",
    };
  }
  if (dayDiff === 1) {
    return {
      label: `Tmrw ${eventTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
      urgency: "tomorrow",
    };
  }
  return {
    label: eventTime.toLocaleDateString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
    urgency: "this-week",
  };
}

const GROUP_LABELS: Record<TimeGroup, string> = {
  now: "Happening Now",
  soon: "Starting Soon",
  "later-today": "Later Today",
  tomorrow: "Tomorrow",
  "this-week": "This Week",
};
const GROUP_ORDER: TimeGroup[] = ["now", "soon", "later-today", "tomorrow", "this-week"];
const URGENCY_STYLES: Record<TimeGroup, { badge: string; text: string }> = {
  now: { badge: "bg-red-100 text-red-700", text: "text-red-600" },
  soon: { badge: "bg-amber-100 text-amber-700", text: "text-amber-600" },
  "later-today": { badge: "bg-indigo-50 text-indigo-600", text: "text-indigo-500" },
  tomorrow: { badge: "bg-gray-100 text-gray-600", text: "text-gray-500" },
  "this-week": { badge: "bg-gray-50 text-gray-500", text: "text-gray-400" },
};

/* ═══ Princeton bounds ═══ */
const PRINCETON_CENTER: [number, number] = [40.3473, -74.6554];
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [40.335, -74.674],
  [40.358, -74.643],
];

/* ═══ Date helpers ═══ */
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

function getWeekStart(weekOffset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + weekOffset * 7);
  return d;
}

function getWeekDays(weekOffset: number): {
  dateStr: string;
  dayName: string;
  dayNum: number;
  monthShort: string;
  isToday: boolean;
  isPast: boolean;
}[] {
  const start = getWeekStart(weekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: {
    dateStr: string;
    dayName: string;
    dayNum: number;
    monthShort: string;
    isToday: boolean;
    isPast: boolean;
  }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = toDateStr(d);
    days.push({
      dateStr,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      monthShort: d.toLocaleDateString("en-US", { month: "short" }),
      isToday: dateStr === toDateStr(today),
      isPast: d < today,
    });
  }
  return days;
}

function getWeekLabel(weekOffset: number): string {
  const start = getWeekStart(weekOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
}

/* ═══ Marker builders ═══ */
function buildActiveMarkerIcon(locEvents: MapEvent[], isSelected: boolean): L.DivIcon | null {
  if (typeof window === "undefined") return null;
  const leaflet = require("leaflet") as typeof L;

  const count = locEvents.length;
  const first = locEvents[0];
  if (!first) return null;
  const color = getEventColor(first.tags);
  const rel = getRelativeLabel(first.rawDatetime);
  const urgencyStyle = URGENCY_STYLES[rel.urgency];

  if (count === 1) {
    const title = first.title.length > 24 ? `${first.title.slice(0, 22)}…` : first.title;
    const isNow = rel.urgency === "now";
    return leaflet.divIcon({
      className: "",
      iconSize: [200, 44],
      iconAnchor: [14, 22],
      popupAnchor: [86, -26],
      html: `<div style="display:flex;align-items:center;gap:6px;pointer-events:auto;">
        <div style="
          width:${isSelected ? 18 : 14}px;height:${isSelected ? 18 : 14}px;
          border-radius:50%;background:${color.dot};
          border:2.5px solid white;
          box-shadow:0 1px 6px rgba(0,0,0,0.15)${isSelected ? `,0 0 0 3px ${color.dot}30` : ""}${isNow ? `,0 0 0 4px ${color.dot}20` : ""};
          flex-shrink:0;
        "></div>
        <div style="
          background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);
          border-radius:10px;padding:4px 8px;
          box-shadow:0 2px 10px rgba(0,0,0,0.08),0 0 0 1px rgba(0,0,0,0.04);
          white-space:nowrap;max-width:170px;pointer-events:auto;cursor:pointer;
          ${isSelected ? "box-shadow:0 2px 14px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.06);" : ""}
        ">
          <div style="font-size:11px;font-weight:600;color:#1e293b;overflow:hidden;text-overflow:ellipsis;">${title}</div>
          <div style="font-size:9px;font-weight:600;color:${urgencyStyle.text.includes("red") ? "#dc2626" : urgencyStyle.text.includes("amber") ? "#d97706" : urgencyStyle.text.includes("indigo") ? "#4f46e5" : "#64748b"};margin-top:1px;letter-spacing:0.02em;">${rel.label}${isNow ? " ●" : ""}</div>
        </div>
      </div>`,
    });
  }

  const dotSize = isSelected ? 28 : 24;
  return leaflet.divIcon({
    className: "",
    iconSize: [dotSize + 8, dotSize + 8],
    iconAnchor: [(dotSize + 8) / 2, (dotSize + 8) / 2],
    popupAnchor: [0, -(dotSize / 2 + 6)],
    html: `<div style="width:${dotSize + 8}px;height:${dotSize + 8}px;display:flex;align-items:center;justify-content:center;">
      <div style="width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${color.dot};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.15)${isSelected ? `,0 0 0 3px ${color.dot}30` : ""};display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <span style="color:white;font-size:12px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,0.2);">${count}</span>
      </div>
    </div>`,
  });
}

/** Dimmed marker for events outside the selected day filter */
function buildDimmedMarkerIcon(count: number): L.DivIcon | null {
  if (typeof window === "undefined") return null;
  const leaflet = require("leaflet") as typeof L;
  const size = count > 1 ? 10 : 7;
  return leaflet.divIcon({
    className: "",
    iconSize: [size + 6, size + 6],
    iconAnchor: [(size + 6) / 2, (size + 6) / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `<div style="width:${size + 6}px;height:${size + 6}px;display:flex;align-items:center;justify-content:center;">
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:#cbd5e1;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;opacity:0.6;"></div>
    </div>`,
  });
}

/* ═══ Popup + control overrides ═══ */
const LIGHT_STYLES = `
  .leaflet-popup-content-wrapper {
    background: white !important; border-radius: 14px !important;
    border: 1px solid rgba(0,0,0,0.06) !important;
    box-shadow: 0 8px 30px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06) !important;
    padding: 0 !important; overflow: hidden !important;
  }
  .leaflet-popup-content { margin: 0 !important; min-width: 220px !important; }
  .leaflet-popup-tip { background: white !important; border: none !important; box-shadow: 0 2px 4px rgba(0,0,0,0.06) !important; }
  .leaflet-popup-close-button { color: #94a3b8 !important; font-size: 16px !important; top: 6px !important; right: 8px !important; }
  .leaflet-popup-close-button:hover { color: #1e293b !important; }
  .leaflet-control-zoom { border: none !important; border-radius: 10px !important; overflow: hidden !important; box-shadow: 0 2px 12px rgba(0,0,0,0.1) !important; }
  .leaflet-control-zoom a { background: rgba(255,255,255,0.92) !important; backdrop-filter: blur(8px) !important; color: #334155 !important; border: none !important; border-bottom: 1px solid rgba(0,0,0,0.06) !important; width: 34px !important; height: 34px !important; line-height: 34px !important; font-size: 15px !important; }
  .leaflet-control-zoom a:hover { background: white !important; color: #0f172a !important; }
  .leaflet-control-zoom a:last-child { border-bottom: none !important; }
  .leaflet-control-attribution { background: rgba(255,255,255,0.75) !important; backdrop-filter: blur(4px) !important; color: #94a3b8 !important; font-size: 9px !important; border: none !important; border-radius: 4px 0 0 0 !important; }
  .leaflet-control-attribution a { color: #64748b !important; }
`;

/* ═══ Off-screen indicators ═══ */
interface OffscreenIndicator {
  x: number;
  y: number;
  angle: number;
  color: string;
  count: number;
  locName: string;
}

function computeOffscreenIndicators(
  mapInstance: L.Map,
  locationGroups: Map<string, MapEvent[]>,
  containerEl: HTMLElement,
): OffscreenIndicator[] {
  const bounds = mapInstance.getBounds();
  const indicators: OffscreenIndicator[] = [];
  const rect = containerEl.getBoundingClientRect();
  const cw = rect.width;
  const ch = rect.height;
  const pad = 40;

  for (const [, locEvents] of locationGroups) {
    const first = locEvents[0];
    if (!first) continue;
    const latLng = { lat: first.latitude, lng: first.longitude };
    if (bounds.contains(latLng)) continue;

    const point = mapInstance.latLngToContainerPoint(latLng);
    const cx = cw / 2;
    const cy = ch / 2;
    const angle = Math.atan2(point.y - cy, point.x - cx);

    indicators.push({
      x: Math.max(pad, Math.min(cw - pad, cx + Math.cos(angle) * (cw / 2 - pad))),
      y: Math.max(pad, Math.min(ch - pad, cy + Math.sin(angle) * (ch / 2 - pad))),
      angle: (angle * 180) / Math.PI,
      color: getEventColor(first.tags).dot,
      count: locEvents.length,
      locName: first.locationName,
    });
  }
  return indicators;
}

/* ═══ Component ═══ */
interface MapClientProps {
  initialEvents: MapEvent[];
}

export function MapClient({ initialEvents }: MapClientProps) {
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState(initialEvents);
  const [mounted, setMounted] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [offscreenIndicators, setOffscreenIndicators] = useState<OffscreenIndicator[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // null = "All"
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const sheetListRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Stable ref callback to avoid infinite re-renders
  const mapRefCallback = useCallback((node: L.Map | null) => {
    if (node && node !== mapRef.current) {
      mapRef.current = node;
      setMapInstance(node);
    }
  }, []);

  // Inject CSS
  useEffect(() => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const styleId = "forum-map-light";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = LIGHT_STYLES;
      document.head.appendChild(style);
    }
    setMounted(true);
  }, []);

  // Fetch events for the current week
  const fetchWeek = useCallback((offset: number) => {
    const start = getWeekStart(offset);
    startTransition(async () => {
      const result = await getMapEvents({ from: toDateStr(start), days: 7 });
      setEvents(result);
    });
  }, []);

  const shiftWeek = useCallback(
    (dir: -1 | 1) => {
      const newOffset = weekOffset + dir;
      setWeekOffset(newOffset);
      setSelectedDay(null);
      setActiveLocation(null);
      fetchWeek(newOffset);
    },
    [weekOffset, fetchWeek],
  );

  const toggleDay = useCallback((dateStr: string) => {
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr));
    setActiveLocation(null);
  }, []);

  // Derived: which events match the current day filter
  const filteredEvents = useMemo(() => {
    if (!selectedDay) return events;
    return events.filter((e) => e.rawDatetime.startsWith(selectedDay));
  }, [events, selectedDay]);

  // Location groups for map markers (ALL events, for dimmed dots)
  const allLocationGroups = useMemo(() => {
    const groups = new Map<string, MapEvent[]>();
    for (const event of events) {
      const group = groups.get(event.locationId);
      if (group) group.push(event);
      else groups.set(event.locationId, [event]);
    }
    return groups;
  }, [events]);

  // Location groups for filtered events only (for active markers + off-screen indicators)
  const filteredLocationGroups = useMemo(() => {
    const groups = new Map<string, MapEvent[]>();
    for (const event of filteredEvents) {
      const group = groups.get(event.locationId);
      if (group) group.push(event);
      else groups.set(event.locationId, [event]);
    }
    return groups;
  }, [filteredEvents]);

  // Time groups for sheet (uses filtered events)
  const timeGroups = useMemo(() => {
    const groups: Record<TimeGroup, MapEvent[]> = {
      now: [],
      soon: [],
      "later-today": [],
      tomorrow: [],
      "this-week": [],
    };
    for (const event of filteredEvents) {
      groups[getTimeGroup(event.rawDatetime)].push(event);
    }
    return groups;
  }, [filteredEvents]);

  // Week days for the strip
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  // Event count per day
  const dayEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const d = event.rawDatetime.slice(0, 10);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return counts;
  }, [events]);

  // Off-screen indicators (only for filtered/visible markers)
  const updateIndicators = useCallback(() => {
    if (!mapInstance || !mapContainerRef.current) return;
    setOffscreenIndicators(
      computeOffscreenIndicators(mapInstance, filteredLocationGroups, mapContainerRef.current),
    );
  }, [mapInstance, filteredLocationGroups]);

  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.on("moveend", updateIndicators);
    mapInstance.on("zoomend", updateIndicators);
    updateIndicators();
    return () => {
      mapInstance.off("moveend", updateIndicators);
      mapInstance.off("zoomend", updateIndicators);
    };
  }, [mapInstance, updateIndicators]);

  const flyToEvent = useCallback(
    (event: MapEvent) => {
      setActiveLocation(event.locationId);
      mapInstance?.flyTo([event.latitude, event.longitude], 17, { duration: 0.5 });
    },
    [mapInstance],
  );

  const flyToIndicator = useCallback(
    (indicator: OffscreenIndicator) => {
      for (const [, locEvents] of filteredLocationGroups) {
        const first = locEvents[0];
        if (first?.locationName === indicator.locName) {
          setActiveLocation(first.locationId);
          mapInstance?.flyTo([first.latitude, first.longitude], 17, { duration: 0.5 });
          break;
        }
      }
    },
    [mapInstance, filteredLocationGroups],
  );

  const recenter = useCallback(() => {
    mapInstance?.flyTo(PRINCETON_CENTER, 16, { duration: 0.4 });
    setActiveLocation(null);
  }, [mapInstance]);

  // Selected day full label for sheet header
  const selectedDayLabel = useMemo(() => {
    if (!selectedDay) return null;
    const d = new Date(`${selectedDay}T12:00:00`);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }, [selectedDay]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {/* ═══ Full-bleed map ═══ */}
      <div ref={mapContainerRef} className="absolute inset-0">
        {mounted && (
          <MapContainer
            center={PRINCETON_CENTER}
            zoom={16}
            minZoom={15}
            maxZoom={18}
            maxBounds={CAMPUS_BOUNDS}
            maxBoundsViscosity={0.85}
            style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
            zoomControl={true}
            ref={mapRefCallback}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Render markers — active (filtered) markers are colorful, dimmed ones are gray */}
            {Array.from(allLocationGroups.entries()).map(([locId, locEvents]) => {
              const first = locEvents[0];
              if (!first) return null;

              const isInFilter = filteredLocationGroups.has(locId);
              const displayEvents = isInFilter
                ? (filteredLocationGroups.get(locId) ?? locEvents)
                : locEvents;
              const isSelected = activeLocation === locId;

              const icon = isInFilter
                ? buildActiveMarkerIcon(displayEvents, isSelected)
                : selectedDay
                  ? buildDimmedMarkerIcon(locEvents.length)
                  : buildActiveMarkerIcon(displayEvents, isSelected);

              if (!icon) return null;

              return (
                <Marker
                  key={locId}
                  position={[first.latitude, first.longitude]}
                  icon={icon}
                  zIndexOffset={isInFilter ? 100 : 0}
                  eventHandlers={{
                    click: () => {
                      setActiveLocation(locId);
                      setSheetOpen(true);
                      // If clicking a dimmed marker, clear the day filter so user can see it
                      if (!isInFilter && selectedDay) {
                        setSelectedDay(null);
                      }
                    },
                  }}
                >
                  <Popup>
                    <div className="p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                        <MapPin size={10} className="text-gray-400" />
                        {first.locationName}
                      </p>
                      <div className="space-y-0.5">
                        {locEvents.map((event) => {
                          const color = getEventColor(event.tags);
                          const rel = getRelativeLabel(event.rawDatetime);
                          const urgency = URGENCY_STYLES[rel.urgency];
                          return (
                            <Link
                              key={event.id}
                              href={`/events/${event.id}`}
                              className="block px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: color.dot }}
                                />
                                <span className="text-[13px] font-semibold text-gray-800 truncate flex-1">
                                  {event.title}
                                </span>
                                <span
                                  className={cn(
                                    "text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md",
                                    urgency.badge,
                                  )}
                                >
                                  {rel.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5 ml-4">
                                {event.datetime}
                                {event.orgName && ` · ${event.orgName}`}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Off-screen indicators (only for filtered events) */}
        {offscreenIndicators.map((ind) => (
          <button
            key={`${ind.locName}-${ind.angle}`}
            type="button"
            onClick={() => flyToIndicator(ind)}
            className="absolute z-500 group"
            style={{ left: ind.x, top: ind.y, transform: "translate(-50%,-50%)" }}
            title={`${ind.locName} — ${ind.count} event${ind.count > 1 ? "s" : ""}`}
          >
            <div className="relative">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                style={{ background: ind.color, boxShadow: `0 2px 8px ${ind.color}40` }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{ transform: `rotate(${ind.angle}deg)` }}
                  role="img"
                  aria-label={`Navigate to ${ind.locName}`}
                >
                  <path
                    d="M2 6H10M10 6L7 3M10 6L7 9"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {ind.count > 1 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[9px] font-bold flex items-center justify-center shadow-sm"
                  style={{ color: ind.color }}
                >
                  {ind.count}
                </span>
              )}
            </div>
          </button>
        ))}

        {!mounted && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-gray-400 font-medium">Loading map</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Top bar — week strip with navigation ═══ */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-500">
        <div className="bg-white/92 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/6 border border-gray-200/60 flex items-center">
          {/* Prev week */}
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            disabled={isPending}
            className="px-2 py-3 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 shrink-0"
            title="Previous week"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="flex flex-col items-center">
            {/* Week label */}
            <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 pb-0.5">
              {weekOffset === 0 ? "This Week" : getWeekLabel(weekOffset)}
            </span>

            {/* Day pills */}
            <div className="flex items-center gap-0.5 px-0.5 pb-1.5">
              {/* All button */}
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className={cn(
                  "px-2 py-1.5 rounded-lg transition-all duration-150 text-[10px] font-bold uppercase tracking-wider",
                  selectedDay === null
                    ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                    : "text-gray-400 hover:bg-gray-100/80 hover:text-gray-600",
                )}
              >
                All
              </button>

              {weekDays.map((day) => {
                const count = dayEventCounts.get(day.dateStr) ?? 0;
                const isSelected = selectedDay === day.dateStr;
                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => toggleDay(day.dateStr)}
                    className={cn(
                      "flex flex-col items-center px-2 py-1 rounded-lg transition-all duration-150 min-w-[36px] relative",
                      isSelected
                        ? "bg-gray-900 shadow-md shadow-gray-900/20"
                        : day.isToday
                          ? "bg-indigo-50"
                          : "hover:bg-gray-100/80",
                      day.isPast && !isSelected && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[8px] font-semibold uppercase tracking-wider leading-none",
                        isSelected
                          ? "text-white/70"
                          : day.isToday
                            ? "text-indigo-500"
                            : "text-gray-400",
                      )}
                    >
                      {day.dayName.slice(0, 3)}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold leading-tight mt-0.5",
                        isSelected
                          ? "text-white"
                          : day.isToday
                            ? "text-indigo-600"
                            : "text-gray-700",
                      )}
                    >
                      {day.dayNum}
                    </span>
                    {count > 0 && (
                      <div className="flex items-center justify-center mt-px">
                        <div
                          className={cn(
                            "w-1 h-1 rounded-full",
                            isSelected
                              ? "bg-indigo-400"
                              : day.isToday
                                ? "bg-indigo-400"
                                : count > 2
                                  ? "bg-indigo-400"
                                  : "bg-gray-300",
                          )}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next week */}
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            disabled={isPending}
            className="px-2 py-3 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 shrink-0"
            title="Next week"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ═══ Recenter ═══ */}
      <button
        type="button"
        onClick={recenter}
        className="absolute top-3 right-3 z-500 w-9 h-9 rounded-xl bg-white/92 backdrop-blur-xl border border-gray-200/60 shadow-lg shadow-black/6 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-white transition-all"
        title="Recenter campus"
      >
        <Navigation size={14} />
      </button>

      {/* ═══ Bottom sheet ═══ */}
      <div
        className={cn(
          "absolute bottom-0 left-3 right-3 z-500 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          sheetOpen ? "h-[85vh]" : "h-[52px]",
        )}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.08)] border border-gray-200/60 border-b-0 flex flex-col h-full overflow-hidden">
          {/* Handle bar */}
          <button
            type="button"
            onClick={() => setSheetOpen((o) => !o)}
            className="shrink-0 flex flex-col items-center gap-2 px-5 pt-2.5 pb-2 group cursor-pointer"
          >
            {/* Drag pill indicator */}
            <div className="w-8 h-1 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors" />

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                {filteredEvents.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {filteredEvents.slice(0, 4).map((e) => (
                      <div
                        key={e.id}
                        className="w-3 h-3 rounded-full border-2 border-white"
                        style={{ background: getEventColor(e.tags).dot }}
                      />
                    ))}
                  </div>
                )}
                <span className="text-[13px] font-semibold text-gray-800">
                  {isPending ? (
                    <span className="text-gray-400 animate-pulse">Loading...</span>
                  ) : (
                    <>
                      {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                      <span className="text-gray-400 font-normal">
                        {selectedDay ? ` · ${selectedDayLabel}` : " this week"}
                      </span>
                    </>
                  )}
                </span>
                {!selectedDay && timeGroups.now.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-600 animate-pulse">
                    {timeGroups.now.length} NOW
                  </span>
                )}
                {!selectedDay && timeGroups.soon.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                    {timeGroups.soon.length} soon
                  </span>
                )}
              </div>
              <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                {sheetOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </div>
            </div>
          </button>

          {/* Scrollable event list — always rendered when not collapsed, uses remaining flex space */}
          {sheetOpen && (
            <div
              ref={sheetListRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8 border-t border-gray-100"
            >
              {filteredEvents.length === 0 && !isPending && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MapPin size={18} className="text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-500">
                    {selectedDay ? "No events on this day" : "No upcoming events"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedDay
                      ? "Try selecting a different day or view all"
                      : "Nothing scheduled this week"}
                  </p>
                </div>
              )}

              {/* Day-filtered view: flat list sorted by time */}
              {selectedDay && filteredEvents.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                      {selectedDayLabel}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                      {filteredEvents.length}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isActive={activeLocation === event.locationId}
                        onLocate={flyToEvent}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All-week view: grouped by time proximity */}
              {!selectedDay &&
                GROUP_ORDER.map((groupKey) => {
                  const groupEvents = timeGroups[groupKey];
                  if (groupEvents.length === 0) return null;
                  const groupStyle = URGENCY_STYLES[groupKey];
                  return (
                    <div key={groupKey} className="mt-3 first:mt-1">
                      <div className="flex items-center gap-2 px-1 mb-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            groupStyle.text,
                          )}
                        >
                          {GROUP_LABELS[groupKey]}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                            groupStyle.badge,
                          )}
                        >
                          {groupEvents.length}
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {groupEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            isActive={activeLocation === event.locationId}
                            onLocate={flyToEvent}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Loading overlay ═══ */}
      {isPending && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] flex items-center justify-center z-400 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/92 backdrop-blur-md shadow-lg shadow-black/6 border border-gray-200/60">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-600">Loading events</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Event card (extracted to reduce duplication) ═══ */
function EventCard({
  event,
  isActive,
  onLocate,
}: {
  event: MapEvent;
  isActive: boolean;
  onLocate: (e: MapEvent) => void;
}) {
  const color = getEventColor(event.tags);
  const rel = getRelativeLabel(event.rawDatetime);
  const urgency = URGENCY_STYLES[rel.urgency];

  return (
    <button
      type="button"
      onClick={() => onLocate(event)}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group flex items-start gap-3",
        isActive ? "bg-gray-100 ring-1 ring-gray-200" : "hover:bg-gray-50",
      )}
    >
      <div
        className={cn(
          "w-3 h-3 rounded-full mt-0.5 shrink-0 ring-2 ring-white",
          rel.urgency === "now" && "animate-pulse",
        )}
        style={{ background: color.dot }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight flex-1">
            {event.title}
          </p>
          <span
            className={cn("text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md", urgency.badge)}
          >
            {rel.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Clock size={10} className="text-gray-400 shrink-0" />
          <span className="text-[11px] text-gray-500">{event.datetime}</span>
          {event.orgName && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[11px] text-gray-400 truncate">{event.orgName}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={9} className="text-gray-300 shrink-0" />
          <span className="text-[10px] text-gray-400 truncate">{event.locationName}</span>
        </div>
      </div>
      <Link
        href={`/events/${event.id}`}
        onClick={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 p-1 rounded-lg hover:bg-gray-200/60 text-gray-400 hover:text-gray-600"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          role="img"
          aria-label="View event"
        >
          <path
            d="M4.5 3L7.5 6L4.5 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </button>
  );
}
