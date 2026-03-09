"use client";

import { Calendar, MapPin, SlidersHorizontal, Users } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import {
  type FeedEvent,
  type FriendsEvent,
  getFeedEvents,
  toggleRsvp,
  toggleSave,
} from "~/actions/events";
import { EventCard, getCategoryColor } from "~/components/events/event-card";
import { EventFilters } from "~/components/events/event-filters";
import { cn } from "~/lib/utils";

interface ExploreClientProps {
  initialEvents: FeedEvent[];
  initialTotal: number;
  savedEvents: FeedEvent[];
  friendsEvents: FriendsEvent[];
  initialSearch?: string;
}

export function ExploreClient({
  initialEvents,
  initialTotal,
  savedEvents,
  friendsEvents,
  initialSearch = "",
}: ExploreClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [orgCategory, setOrgCategory] = useState("");
  const [dateRange, setDateRange] = useState<"" | "today" | "week" | "month">("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refreshEvents = useCallback(
    (filters: string[], search: string, opts?: { orgCategory?: string; dateRange?: string }) => {
      startTransition(async () => {
        const result = await getFeedEvents({
          tags: filters.length > 0 ? filters : undefined,
          search: search || undefined,
          orgCategory: opts?.orgCategory || undefined,
          dateRange: (opts?.dateRange as "today" | "week" | "month") || undefined,
        });
        setEvents(result.events);
        setTotal(result.total);
      });
    },
    [],
  );

  const handleFilterToggle = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter((f) => f !== filterId)
      : [...activeFilters, filterId];
    setActiveFilters(newFilters);
    refreshEvents(newFilters, searchQuery, { orgCategory, dateRange });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    refreshEvents(activeFilters, query, { orgCategory, dateRange });
  };

  const handleOrgCategoryChange = (cat: string) => {
    setOrgCategory(cat);
    refreshEvents(activeFilters, searchQuery, { orgCategory: cat, dateRange });
  };

  const handleDateRangeChange = (range: "" | "today" | "week" | "month") => {
    setDateRange(range);
    refreshEvents(activeFilters, searchQuery, { orgCategory, dateRange: range });
  };

  const handleSaveToggle = async (eventId: string) => {
    const result = await toggleSave(eventId);
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, isSaved: result.saved } : e)));
  };

  const handleRsvpToggle = async (eventId: string) => {
    const result = await toggleRsvp(eventId);
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, isRsvped: result.rsvped, rsvpCount: result.count } : e,
      ),
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <EventFilters activeFilters={activeFilters} onFilterToggle={handleFilterToggle} />
      <div className="px-6 py-2 flex-shrink-0 flex items-center gap-2 flex-wrap">
        {friendsEvents.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFriendsOnly(!showFriendsOnly)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
              showFriendsOnly
                ? "bg-indigo-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200",
            )}
          >
            <Users size={12} />
            Friends Going ({friendsEvents.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
            showAdvanced || orgCategory || dateRange
              ? "bg-indigo-500 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200",
          )}
        >
          <SlidersHorizontal size={12} />
          More Filters
        </button>
        {showAdvanced && (
          <>
            <select
              value={orgCategory}
              onChange={(e) => handleOrgCategoryChange(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Org Types</option>
              <option value="career">Career</option>
              <option value="affinity">Affinity</option>
              <option value="performance">Performance</option>
              <option value="academic">Academic</option>
              <option value="athletic">Athletic</option>
              <option value="social">Social</option>
              <option value="cultural">Cultural</option>
              <option value="religious">Religious</option>
              <option value="political">Political</option>
              <option value="service">Service</option>
            </select>
            {(["today", "week", "month"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleDateRangeChange(dateRange === range ? "" : range)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  dateRange === range
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                )}
              >
                <Calendar size={10} />
                {range === "today" ? "Today" : range === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main event grid */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {(() => {
            const displayEvents = showFriendsOnly ? friendsEvents : events;
            return displayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-4xl mb-4">🎉</p>
                <p className="text-lg font-semibold text-gray-700">
                  {isPending
                    ? "Loading events..."
                    : showFriendsOnly
                      ? "No friends attending upcoming events"
                      : "No events found"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {showFriendsOnly
                    ? "Your friends haven't RSVP'd to any upcoming events yet."
                    : activeFilters.length > 0 || searchQuery
                      ? "Try adjusting your filters or search."
                      : "Events will appear here once they're created."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    {...event}
                    onSaveToggle={() => handleSaveToggle(event.id)}
                    onShare={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
                    }}
                  />
                ))}
              </div>
            );
          })()}
        </div>

        {/* Right panel */}
        <aside className="hidden lg:flex flex-col w-80 bg-white border-l border-gray-200 h-full overflow-y-auto flex-shrink-0">
          {/* Recently Saved */}
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Recently Saved</h2>
            </div>
            {savedEvents.length === 0 ? (
              <p className="text-xs text-gray-400">Save events to see them here.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {savedEvents.map((event) => {
                  const color = getCategoryColor(event.tags);
                  return (
                    <div key={event.id} className="flex gap-3">
                      <div
                        className="rounded-xl flex-shrink-0"
                        style={{
                          width: 56,
                          height: 56,
                          background: event.flyerUrl ? undefined : `${color.accent}40`,
                        }}
                      >
                        {event.flyerUrl && (
                          <img
                            src={event.flyerUrl}
                            alt={event.title}
                            className="w-14 h-14 rounded-xl object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                          {event.title}
                        </p>
                        {event.orgName && (
                          <p className="text-xs text-gray-400 mt-0.5">{event.orgName}</p>
                        )}
                        <p className="text-xs text-gray-400">{event.location}</p>
                        <p className="text-xs text-gray-400">{event.datetime}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Friend activity placeholder */}
          <div className="px-5 py-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Friends</h2>
            <p className="text-xs text-gray-400">
              Add friends to see what events they&apos;re attending.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
