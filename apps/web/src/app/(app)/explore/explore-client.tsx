"use client";

import { Compass, MapPin, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type ExploreExperience,
  type FeedEvent,
  dismissEvent,
  getExploreExperience,
  toggleSave,
  trackEventInteractions,
} from "~/actions/events";
import { EventFilters } from "~/components/events/event-filters";
import { FeedShelf } from "~/components/events/feed-shelf";
import { MyWeekRail } from "~/components/events/my-week-rail";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

interface ExploreClientProps {
  initialExperience: ExploreExperience;
  locations: { id: string; name: string; category: string }[];
  initialSearch?: string;
}

const ALL_ORGS_VALUE = "__all-orgs__";
const ALL_LOCATIONS_VALUE = "__all-locations__";

export function ExploreClient({
  initialExperience,
  locations,
  initialSearch = "",
}: ExploreClientProps) {
  const [experience, setExperience] = useState(initialExperience);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);
  const [orgCategory, setOrgCategory] = useState("");
  const [locationId, setLocationId] = useState("");
  const [dateRange, setDateRange] = useState<"" | "today" | "week" | "month">("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPending, startTransition] = useTransition();
  const impressionLogRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setExperience(initialExperience);
  }, [initialExperience]);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const refreshExperience = useCallback(
    (
      filters: string[],
      search: string,
      opts?: { orgCategory?: string; locationId?: string; dateRange?: string },
    ) => {
      startTransition(async () => {
        const next = await getExploreExperience({
          tags: filters.length > 0 ? filters : undefined,
          search: search || undefined,
          orgCategory: opts?.orgCategory || undefined,
          locationId: opts?.locationId || undefined,
          dateRange: (opts?.dateRange as "today" | "week" | "month") || undefined,
        });
        setExperience(next);
      });
    },
    [],
  );

  useEffect(() => {
    const unseenInteractions = experience.sections.flatMap((section) =>
      section.events
        .filter(
          (event) =>
            event.rankingSnapshotId && !impressionLogRef.current.has(event.rankingSnapshotId),
        )
        .map((event) => ({
          eventId: event.id,
          interactionType: "impression" as const,
          surface: "explore" as const,
          shelf: section.id,
          rankingSnapshotId: event.rankingSnapshotId,
          reasonCodes: event.reasons?.map((reason) => reason.code),
        })),
    );

    if (unseenInteractions.length === 0) return;

    for (const interaction of unseenInteractions) {
      if (interaction.rankingSnapshotId) {
        impressionLogRef.current.add(interaction.rankingSnapshotId);
      }
    }

    void trackEventInteractions(unseenInteractions);
  }, [experience.sections]);

  const handleFilterToggle = (filterId: string) => {
    const nextFilters = activeFilters.includes(filterId)
      ? activeFilters.filter((filter) => filter !== filterId)
      : [...activeFilters, filterId];
    setActiveFilters(nextFilters);
    refreshExperience(nextFilters, searchQuery, { orgCategory, locationId, dateRange });
  };

  const handleOrgCategoryChange = (nextCategory: string) => {
    setOrgCategory(nextCategory);
    refreshExperience(activeFilters, searchQuery, {
      orgCategory: nextCategory,
      locationId,
      dateRange,
    });
  };

  const handleLocationChange = (nextLocationId: string) => {
    setLocationId(nextLocationId);
    refreshExperience(activeFilters, searchQuery, {
      orgCategory,
      locationId: nextLocationId,
      dateRange,
    });
  };

  const handleDateRangeChange = (range: "" | "today" | "week" | "month") => {
    setDateRange(range);
    refreshExperience(activeFilters, searchQuery, {
      orgCategory,
      locationId,
      dateRange: range,
    });
  };

  const updateEventEverywhere = useCallback(
    (eventId: string, updater: (event: FeedEvent) => FeedEvent) => {
      setExperience((prev) => ({
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          events: section.events.map((event) => (event.id === eventId ? updater(event) : event)),
        })),
        weeklyBriefing: prev.weeklyBriefing
          ? {
              ...prev.weeklyBriefing,
              events: prev.weeklyBriefing.events.map((event) =>
                event.id === eventId ? updater(event) : event,
              ),
            }
          : null,
        myWeek: {
          ...prev.myWeek,
          upcoming: prev.myWeek.upcoming.map((event) =>
            event.id === eventId ? updater(event) : event,
          ),
          socialHighlights: prev.myWeek.socialHighlights.map((event) =>
            event.id === eventId ? updater(event) : event,
          ),
        },
      }));
    },
    [],
  );

  const handleSaveToggle = async (event: FeedEvent, shelfId: string) => {
    const previousValue = event.isSaved;

    updateEventEverywhere(event.id, (current) => ({
      ...current,
      isSaved: !previousValue,
    }));

    const result = await toggleSave(event.id, {
      surface: "explore",
      shelf: shelfId,
      rankingSnapshotId: event.rankingSnapshotId,
      reasonCodes: event.reasons?.map((reason) => reason.code),
      metadata: { searchQuery },
    });

    updateEventEverywhere(event.id, (current) => ({
      ...current,
      isSaved: result.saved,
    }));
  };

  const handleShare = async (event: FeedEvent, shelfId: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    toast.success("Event link copied");

    await trackEventInteractions([
      {
        eventId: event.id,
        interactionType: "share",
        surface: "explore",
        shelf: shelfId,
        rankingSnapshotId: event.rankingSnapshotId,
        reasonCodes: event.reasons?.map((reason) => reason.code),
      },
    ]);
  };

  const handleDismiss = async (event: FeedEvent, shelfId: string) => {
    setExperience((prev) => ({
      ...prev,
      sections: prev.sections
        .map((section) => ({
          ...section,
          events: section.events.filter((sectionEvent) => sectionEvent.id !== event.id),
        }))
        .filter((section) => section.events.length > 0),
      weeklyBriefing: prev.weeklyBriefing
        ? {
            ...prev.weeklyBriefing,
            events: prev.weeklyBriefing.events.filter(
              (briefingEvent) => briefingEvent.id !== event.id,
            ),
          }
        : null,
    }));

    await dismissEvent(event.id, {
      shelf: shelfId,
      reason: "Not interested",
    });
  };

  const handleOpen = (event: FeedEvent, shelfId: string) => {
    void trackEventInteractions([
      {
        eventId: event.id,
        interactionType: "detail_open",
        surface: "explore",
        shelf: shelfId,
        rankingSnapshotId: event.rankingSnapshotId,
        reasonCodes: event.reasons?.map((reason) => reason.code),
      },
    ]);
  };

  const handleRailOpen = (event: FeedEvent, surface: "my_week" | "weekly_briefing") => {
    void trackEventInteractions([
      {
        eventId: event.id,
        interactionType: "detail_open",
        surface,
        reasonCodes: event.reasons?.map((reason) => reason.code),
      },
    ]);
  };

  const visibleSections = useMemo(
    () =>
      showFriendsOnly
        ? experience.sections.filter((section) => section.id === "friends-going")
        : experience.sections,
    [experience.sections, showFriendsOnly],
  );

  const hasFilters =
    activeFilters.length > 0 || searchQuery || orgCategory || locationId || dateRange;

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%)]">
      <EventFilters activeFilters={activeFilters} onFilterToggle={handleFilterToggle} />

      <div className="border-b border-slate-100 bg-white/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFriendsOnly((value) => !value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              showFriendsOnly
                ? "bg-rose-500 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            )}
          >
            <Users size={12} />
            Friends Going
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              showAdvanced || orgCategory || locationId || dateRange
                ? "bg-indigo-500 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            )}
          >
            <SlidersHorizontal size={12} />
            More Filters
          </button>

          <Badge variant="outline" className="border-slate-200 bg-white text-slate-500">
            {experience.totalCandidates} active candidates
          </Badge>
          {experience.dismissedCount > 0 && (
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-500">
              {experience.dismissedCount} hidden
            </Badge>
          )}
        </div>

        {showAdvanced && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select
              value={orgCategory || ALL_ORGS_VALUE}
              onValueChange={(value) =>
                handleOrgCategoryChange(value === ALL_ORGS_VALUE ? "" : value)
              }
            >
              <SelectTrigger className="h-8 min-w-36 rounded-full border-slate-200 bg-white text-xs text-slate-600">
                <SelectValue placeholder="All Org Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ORGS_VALUE}>All Org Types</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="affinity">Affinity</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="athletic">Athletic</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="religious">Religious</SelectItem>
                <SelectItem value="political">Political</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={locationId || ALL_LOCATIONS_VALUE}
              onValueChange={(value) =>
                handleLocationChange(value === ALL_LOCATIONS_VALUE ? "" : value)
              }
            >
              <SelectTrigger className="h-8 min-w-42 rounded-full border-slate-200 bg-white text-xs text-slate-600">
                <MapPin size={12} className="text-slate-400" />
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LOCATIONS_VALUE}>All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(["today", "week", "month"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => handleDateRangeChange(dateRange === range ? "" : range)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  dateRange === range
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
              >
                {range === "today" ? "Today" : range === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="xl:flex-1 xl:overflow-y-auto px-6 py-6">
          {experience.coldStart && !showFriendsOnly && (
            <Card className="mb-6 gap-4 border-slate-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_100%)] py-5 shadow-none">
              <CardHeader className="px-5 pb-0">
                <div className="flex items-center gap-2 text-amber-500">
                  <Users size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Starter Mode
                  </span>
                </div>
                <CardTitle className="text-xl text-slate-900">
                  The feed is bootstrapping around your interests
                </CardTitle>
                <CardDescription>
                  Save, RSVP, dismiss, and follow organizations to turn these starter picks into a
                  sharper weekly plan.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {experience.weeklyBriefing && !showFriendsOnly && (
            <Card className="mb-6 gap-4 border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)] py-5 text-white shadow-none">
              <CardHeader className="px-5 pb-0">
                <div className="flex items-center gap-2 text-sky-300">
                  <Sparkles size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                    Weekly Briefing
                  </span>
                </div>
                <CardTitle className="text-2xl font-semibold text-white">
                  {experience.weeklyBriefing.title}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {experience.weeklyBriefing.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5">
                <div className="flex flex-wrap gap-2">
                  {experience.weeklyBriefing.events.map((event) => (
                    <Badge
                      key={event.id}
                      variant="outline"
                      className="border-white/20 bg-white/10 px-3 py-1 text-slate-100"
                    >
                      {event.title}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {visibleSections.length === 0 ? (
            <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 px-8 text-center">
              <Compass size={28} className="text-slate-300" />
              <h2 className="mt-4 text-lg font-semibold text-slate-700">
                {isPending
                  ? "Refreshing your feed..."
                  : showFriendsOnly
                    ? "No friend momentum yet"
                    : "No recommendation shelves found"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                {showFriendsOnly
                  ? "Your accepted friends have not saved or RSVP'd to upcoming events yet."
                  : hasFilters
                    ? "Try relaxing your filters or search to widen the candidate pool."
                    : "As more events and interactions land in the system, this feed will sharpen."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {visibleSections.map((section) => (
                <FeedShelf
                  key={section.id}
                  section={section}
                  onOpen={handleOpen}
                  onDismiss={handleDismiss}
                  onSaveToggle={handleSaveToggle}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </div>

        <MyWeekRail
          myWeek={experience.myWeek}
          weeklyBriefing={experience.weeklyBriefing}
          onOpenEvent={handleRailOpen}
        />
      </div>
    </div>
  );
}
