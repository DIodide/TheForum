"use client";

import { ArrowRight, CalendarClock, Flame, Radar, Users } from "lucide-react";
import Link from "next/link";
import type { FeedEvent, MyWeekSummary, WeeklyBriefing } from "~/actions/events";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface MyWeekRailProps {
  myWeek: MyWeekSummary;
  weeklyBriefing: WeeklyBriefing | null;
  onOpenEvent?: (event: FeedEvent, surface: "my_week" | "weekly_briefing") => void;
}

function RailEventItem({
  event,
  emphasis,
  onOpen,
}: {
  event: FeedEvent;
  emphasis?: string;
  onOpen?: () => void;
}) {
  return (
    <Link
      href={`/events/${event.id}`}
      onClick={onOpen}
      className="block rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition-colors hover:border-slate-200 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 line-clamp-2">{event.title}</p>
          {event.orgName && <p className="mt-0.5 text-xs text-slate-500">{event.orgName}</p>}
          <p className="mt-1 text-xs text-slate-500">{event.datetime}</p>
          <p className="text-xs text-slate-400">{event.location}</p>
        </div>
        {emphasis && (
          <Badge variant="outline" className="border-slate-200 bg-white text-[10px] text-slate-500">
            {emphasis}
          </Badge>
        )}
      </div>
    </Link>
  );
}

export function MyWeekRail({ myWeek, weeklyBriefing, onOpenEvent }: MyWeekRailProps) {
  return (
    <aside className="mt-8 flex flex-col gap-4 px-6 pb-6 xl:mt-0 xl:w-86 xl:flex-shrink-0 xl:overflow-y-auto xl:border-l xl:border-slate-200 xl:bg-white/70 xl:px-5 xl:py-6">
      {weeklyBriefing && (
        <Card className="gap-4 border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] py-4 shadow-none">
          <CardHeader className="px-4 pb-0">
            <div className="flex items-center gap-2 text-sky-600">
              <Radar size={15} />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Weekly Briefing
              </span>
            </div>
            <CardTitle className="text-base text-slate-900">{weeklyBriefing.title}</CardTitle>
            <CardDescription>{weeklyBriefing.description}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 space-y-2">
            {weeklyBriefing.events.map((event) => (
              <RailEventItem
                key={event.id}
                event={event}
                emphasis={event.reasons?.[0]?.label}
                onOpen={() => onOpenEvent?.(event, "weekly_briefing")}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="gap-4 border-slate-200 py-4 shadow-none">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center gap-2 text-amber-500">
            <CalendarClock size={15} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">My Week</span>
          </div>
          <CardTitle className="text-base text-slate-900">Upcoming commitments</CardTitle>
          <CardDescription>
            {myWeek.rsvpedCount} RSVP&apos;d, {myWeek.savedCount} saved, {myWeek.followedOrgCount}{" "}
            followed orgs
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 space-y-2">
          {myWeek.upcoming.length > 0 ? (
            myWeek.upcoming.map((event) => (
              <RailEventItem
                key={event.id}
                event={event}
                emphasis={event.isRsvped ? "RSVP'd" : event.isSaved ? "Saved" : undefined}
                onOpen={() => onOpenEvent?.(event, "my_week")}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Save or RSVP to events and they will stack here into a weekly plan.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-4 border-slate-200 py-4 shadow-none">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center gap-2 text-rose-500">
            <Users size={15} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Social Pulse</span>
          </div>
          <CardTitle className="text-base text-slate-900">Friends are creating momentum</CardTitle>
        </CardHeader>
        <CardContent className="px-4 space-y-2">
          {myWeek.socialHighlights.length > 0 ? (
            myWeek.socialHighlights.map((event) => (
              <RailEventItem
                key={event.id}
                event={event}
                emphasis={event.reasons?.[0]?.label}
                onOpen={() => onOpenEvent?.(event, "my_week")}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Add more friends and The Forum will start surfacing what is gaining social traction.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-4 border-slate-200 py-4 shadow-none">
        <CardHeader className="px-4 pb-0">
          <div className="flex items-center gap-2 text-emerald-600">
            <Flame size={15} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Cold Start Help
            </span>
          </div>
          <CardTitle className="text-base text-slate-900">Suggested orgs to follow</CardTitle>
        </CardHeader>
        <CardContent className="px-4 space-y-2">
          {myWeek.suggestedOrgs.length > 0 ? (
            myWeek.suggestedOrgs.map((org) => (
              <Link
                key={org.id}
                href={`/orgs/${org.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-sm transition-colors hover:border-slate-200 hover:bg-white"
              >
                <div>
                  <p className="font-semibold text-slate-800">{org.name}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    {org.category}
                  </p>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              As you interact more, we&apos;ll sharpen organization recommendations here.
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
