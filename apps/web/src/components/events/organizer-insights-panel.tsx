"use client";

import {
  BarChart3,
  Eye,
  MousePointerClick,
  Share2,
  Sparkles,
  Ticket,
  UploadCloud,
} from "lucide-react";
import type { OrganizerAnalytics } from "~/actions/events";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface OrganizerInsightsPanelProps {
  insights: OrganizerAnalytics;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export function OrganizerInsightsPanel({ insights }: OrganizerInsightsPanelProps) {
  const metrics = [
    { label: "Impressions", value: insights.impressionCount, icon: Eye },
    { label: "Detail opens", value: insights.detailOpenCount, icon: MousePointerClick },
    { label: "Saves", value: insights.saveCount, icon: Sparkles },
    { label: "RSVPs", value: insights.rsvpCount, icon: Ticket },
    { label: "Shares", value: insights.shareCount, icon: Share2 },
    { label: "Calendar exports", value: insights.exportCount, icon: UploadCloud },
  ];

  return (
    <Card className="mt-8 border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-none">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sky-600">
            <BarChart3 size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Organizer Insights
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
              Quality {insights.quality.score}/100
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
              CTR {percent(insights.clickThroughRate)}
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
              RSVP {percent(insights.rsvpRate)}
            </Badge>
          </div>
        </div>
        <div>
          <CardTitle className="text-xl text-slate-900">How the funnel is moving</CardTitle>
          <CardDescription>
            {insights.lastAggregatedAt
              ? `Last aggregated ${new Date(insights.lastAggregatedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}`
              : "Showing live interaction counts while background aggregates catch up."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Icon size={14} />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Click-through
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {percent(insights.clickThroughRate)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Save rate
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {percent(insights.saveRate)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Dismissals
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{insights.dismissCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Suggested next moves
          </p>
          {insights.suggestions.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {insights.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              This event is in a healthy state. Keep sharing it through the channels that already
              convert.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
