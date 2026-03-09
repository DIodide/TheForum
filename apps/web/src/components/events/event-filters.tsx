"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "~/lib/utils";

const FILTER_CATEGORIES = [
  { id: "art", color: "#fb923c", label: "Art" },
  { id: "tech", color: "#a78bfa", label: "STEM" },
  { id: "music", color: "#fbbf24", label: "Music" },
  { id: "sports", color: "#60a5fa", label: "Sports" },
  { id: "social", color: "#f472b6", label: "Social" },
  { id: "career", color: "#34d399", label: "Career" },
  { id: "free-food", color: "#f87171", label: "Free Food" },
] as const;

interface EventFiltersProps {
  activeFilters: string[];
  onFilterToggle: (filterId: string) => void;
}

export function EventFilters({ activeFilters, onFilterToggle }: EventFiltersProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
      {FILTER_CATEGORIES.map(({ id, color, label }) => {
        const isActive = activeFilters.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onFilterToggle(id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={cn(
                "rounded-full transition-all",
                isActive && "ring-2 ring-offset-1 ring-gray-400",
              )}
              style={{
                width: 40,
                height: 40,
                background: color,
              }}
            />
            <span
              className={cn(
                "text-xs transition-colors",
                isActive ? "text-gray-800 font-medium" : "text-gray-500",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
      <button type="button" className="flex flex-col items-center gap-1 group ml-2">
        <div className="rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center w-10 h-10">
          <MoreHorizontal size={20} className="text-gray-400" />
        </div>
        <span className="text-xs text-gray-400">More</span>
      </button>
    </div>
  );
}
