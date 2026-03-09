"use client";

import { AlertCircle, CheckCircle2, CircleDashed, Sparkles } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { EventQualityReport } from "~/lib/event-quality";
import { cn } from "~/lib/utils";

interface EventQualityPanelProps {
  report: EventQualityReport;
  mode: "create" | "edit";
}

const LABEL_STYLES: Record<EventQualityReport["label"], string> = {
  Strong: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Good: "border-amber-200 bg-amber-50 text-amber-700",
  "Needs Work": "border-rose-200 bg-rose-50 text-rose-700",
};

export function EventQualityPanel({ report, mode }: EventQualityPanelProps) {
  const actionCopy =
    report.label === "Strong"
      ? mode === "create"
        ? "Ready to publish"
        : "Ready to update"
      : "Improve before publishing";

  return (
    <Card className="border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-none">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sky-600">
            <Sparkles size={16} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">Event Quality</span>
          </div>
          <Badge variant="outline" className={cn("font-medium", LABEL_STYLES[report.label])}>
            {report.label}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-2xl text-slate-900">{report.score}/100</CardTitle>
          <CardDescription>{actionCopy}</CardDescription>
        </div>
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                report.score >= 80
                  ? "bg-emerald-500"
                  : report.score >= 60
                    ? "bg-amber-500"
                    : "bg-rose-500",
              )}
              style={{ width: `${report.score}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-400">
            <span>Weak</span>
            <span>Strong</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Checklist
          </p>
          <div className="mt-3 space-y-2.5">
            {report.checklist.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5">
                {item.met ? (
                  <CheckCircle2 size={15} className="mt-0.5 text-emerald-500" />
                ) : (
                  <CircleDashed size={15} className="mt-0.5 text-slate-300" />
                )}
                <span className={cn("text-sm", item.met ? "text-slate-700" : "text-slate-500")}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-700">
            <AlertCircle size={15} className="text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Suggestions
            </p>
          </div>
          {report.suggestions.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {report.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              This event has enough detail and structure to compete well in the feed.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
