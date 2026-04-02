"use client";

import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { FUTURE_COLOR, NOW_COLOR } from "../_lib/map-constants";
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
    <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-6">
      {/* Legend */}
      <div className="shrink-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NOW_COLOR }} />
          <span className="text-[10px] font-bold text-gray-600 tracking-wide">NOW</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FUTURE_COLOR }} />
          <span className="text-[10px] font-bold text-gray-600 tracking-wide">FUTURE</span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="relative flex items-start min-w-max">
          {/* Background track line */}
          <div className="absolute top-[9px] left-0 right-0 h-[3px] bg-gray-200 rounded-full" />

          {/* Filled track segments between dates with events */}
          {timelineDays.map((day, i) => {
            if (i === 0) return null;
            const prevDay = timelineDays[i - 1];
            const prevHasEvents = prevDay
              ? (eventCountByDate.get(prevDay.dateStr) ?? 0) > 0
              : false;
            const currHasEvents = (eventCountByDate.get(day.dateStr) ?? 0) > 0;

            if (!prevHasEvents || !currHasEvents) return null;

            return (
              <div
                key={`seg-${day.dateStr}`}
                className="absolute top-[7px] h-[7px] rounded-full bg-gray-300"
                style={{
                  left: `${(i - 1) * 72 + 9}px`,
                  width: "72px",
                }}
              />
            );
          })}

          {/* Date nodes */}
          <div className="relative flex items-start gap-0">
            {timelineDays.map((day) => {
              const count = eventCountByDate.get(day.dateStr) ?? 0;
              const isSelected = selectedDate === day.dateStr;
              const hasEvents = count > 0;

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => onSelectDate(day.dateStr)}
                  className="flex flex-col items-center w-[72px] group"
                >
                  {/* Circle node */}
                  <div
                    className={cn(
                      "rounded-full transition-all border-2",
                      isSelected
                        ? "w-[18px] h-[18px] bg-sky-500 border-sky-300 shadow-md shadow-sky-200/50"
                        : hasEvents
                          ? "w-[14px] h-[14px] bg-gray-400 border-white shadow-sm"
                          : "w-[10px] h-[10px] bg-gray-200 border-white mt-[2px]",
                    )}
                  />

                  {/* Date labels */}
                  <span
                    className={cn(
                      "text-[9px] font-bold mt-1.5 uppercase tracking-wider leading-none",
                      isSelected
                        ? "text-sky-600"
                        : day.isToday
                          ? "text-sky-500"
                          : hasEvents
                            ? "text-gray-600"
                            : "text-gray-400",
                    )}
                  >
                    {day.isToday ? "TODAY" : day.dayName}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] leading-none mt-px",
                      isSelected
                        ? "text-sky-600 font-bold"
                        : hasEvents
                          ? "text-gray-500"
                          : "text-gray-400",
                    )}
                  >
                    {day.monthShort} {String(day.dayNum).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
