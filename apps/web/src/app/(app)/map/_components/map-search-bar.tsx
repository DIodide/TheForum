"use client";

import { Search } from "lucide-react";

interface MapSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function MapSearchBar({ value, onChange }: MapSearchBarProps) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="FIND EVENTS"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg shadow-black/5 text-sm text-gray-800 placeholder:text-gray-400 placeholder:text-xs placeholder:tracking-wider placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-sky-300/40"
      />
    </div>
  );
}
