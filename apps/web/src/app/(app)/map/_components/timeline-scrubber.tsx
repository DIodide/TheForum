"use client";

import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { getTimelineDays } from "../_lib/map-helpers";

interface TimelineScrubberProps {
  days: number;
  eventCountByDate: Map<string, number>;
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

export function TimelineScrubber({
  days,
  eventCountByDate,
  selectedDate,
  onSelectDate,
}: TimelineScrubberProps) {
  const timelineDays = useMemo(() => getTimelineDays(days), [days]);

  return (
    <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/60 px-4 py-3">
      <div className="relative flex items-center overflow-x-auto scrollbar-hide">
        {/* Connecting line */}
        <div className="absolute top-[11px] left-4 right-4 h-[2px] bg-gray-200" />

        <div className="flex items-start gap-0 w-full justify-between relative z-0">
          {timelineDays.map((day) => {
            const count = eventCountByDate.get(day.dateStr) ?? 0;
            const isSelected = selectedDate === day.dateStr;
            const hasEvents = count > 0;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => onSelectDate(day.dateStr)}
                className="flex flex-col items-center min-w-[48px] group"
              >
                {/* Node */}
                <div
                  className={cn(
                    "w-[10px] h-[10px] rounded-full border-2 transition-all",
                    isSelected
                      ? "w-[14px] h-[14px] bg-sky-500 border-sky-300 shadow-md shadow-sky-200"
                      : hasEvents
                        ? "bg-sky-400 border-white shadow-sm"
                        : "bg-white border-gray-300 group-hover:border-gray-400",
                  )}
                />

                {/* Event count indicator */}
                {hasEvents && !isSelected && (
                  <div className="flex items-center gap-px mt-0.5">
                    {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                      <div
                        key={`${day.dateStr}-dot-${i}`}
                        className="w-[3px] h-[3px] rounded-full bg-sky-400"
                      />
                    ))}
                  </div>
                )}

                {/* Date label */}
                <span
                  className={cn(
                    "text-[9px] font-semibold mt-1 uppercase tracking-wider",
                    isSelected ? "text-sky-600" : day.isToday ? "text-sky-500" : "text-gray-400",
                  )}
                >
                  {day.isToday ? "TODAY" : day.dayName}
                </span>
                <span
                  className={cn(
                    "text-[9px] leading-none",
                    isSelected ? "text-sky-600 font-bold" : "text-gray-400",
                  )}
                >
                  {day.monthShort} {day.dayNum < 10 ? `0${day.dayNum}` : day.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
