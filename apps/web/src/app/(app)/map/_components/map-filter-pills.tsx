"use client";

import { Heart, Users, Zap } from "lucide-react";
import { cn } from "~/lib/utils";
import type { FilterKey } from "../map-client";

interface MapFilterPillsProps {
  activeFilters: Set<FilterKey>;
  onToggle: (key: FilterKey) => void;
}

const PILLS: { key: FilterKey; label: string; icon: typeof Users }[] = [
  { key: "friends", label: "Find Your Friends", icon: Users },
  { key: "now", label: "Happening Now", icon: Zap },
  { key: "attending", label: "Events You're Attending", icon: Heart },
];

export function MapFilterPills({ activeFilters, onToggle }: MapFilterPillsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PILLS.map(({ key, label, icon: Icon }) => {
        const isActive = activeFilters.has(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border shadow-sm",
              isActive
                ? "bg-sky-50 border-sky-200 text-sky-700 shadow-sky-100"
                : "bg-white/95 backdrop-blur-xl border-gray-200/60 text-gray-600 hover:bg-gray-50 shadow-black/5",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
