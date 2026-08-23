"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

const QUICK_FILTERS = [
  { id: "free food", label: "free food" },
  { id: "tech", label: "tech talk" },
  { id: "career", label: "career" },
  { id: "social event", label: "social" },
  { id: "music", label: "music" },
  { id: "visual arts", label: "art" },
  { id: "athletics", label: "sports" },
] as const;

const ALL_FILTERS = [
  ...QUICK_FILTERS,
  { id: "academics", label: "academics" },
  { id: "culture", label: "culture" },
  { id: "performing arts", label: "performing arts" },
  { id: "speaker event", label: "speaker" },
  { id: "research", label: "research" },
  { id: "entrepreneurship", label: "entrepreneurship" },
  { id: "stem", label: "stem" },
  { id: "literature", label: "literature" },
  { id: "wellness", label: "wellness" },
  { id: "outdoors", label: "outdoors" },
  { id: "sustainability", label: "sustainability" },
  { id: "gaming", label: "gaming" },
  { id: "community service", label: "service" },
  { id: "religion", label: "religion" },
  { id: "politics", label: "politics" },
] as const;

interface EventFiltersProps {
  activeFilters: string[];
  onFilterToggle: (filterId: string) => void;
}

export function EventFilters({ activeFilters, onFilterToggle }: EventFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const filters = expanded ? ALL_FILTERS : QUICK_FILTERS;

  return (
    <div className="flex items-center gap-[8px] flex-wrap">
      {filters.map(({ id, label }) => {
        const isActive = activeFilters.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onFilterToggle(id)}
            className={cn(
              "px-[10px] py-[3px] rounded-[12px] text-[13px] font-dm-sans transition-colors border",
              isActive
                ? "bg-forum-coral-light border-forum-coral text-forum-coral"
                : "border-forum-medium-gray text-forum-light-gray hover:border-forum-dark-gray hover:text-forum-dark-gray",
            )}
          >
            {label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-[4px] text-[11px] text-forum-light-gray hover:text-forum-dark-gray transition-colors ml-1"
      >
        <Pencil size={11} />
        {expanded ? "Less" : "Edit Filters"}
      </button>
    </div>
  );
}
