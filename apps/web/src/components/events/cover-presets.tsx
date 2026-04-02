"use client";

import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

export interface CoverPreset {
  id: string;
  label: string;
  bg: string;
  shapes: {
    type: "circle" | "triangle" | "rect";
    color: string;
    x: number;
    y: number;
    size: number;
    rotation?: number;
  }[];
}

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: "warm-social",
    label: "Social Vibes",
    bg: "#FFF0EB",
    shapes: [
      { type: "circle", color: "#FF7151", x: 30, y: 40, size: 100 },
      { type: "circle", color: "#FFD3EA", x: 180, y: 80, size: 70 },
      { type: "triangle", color: "#FEE882", x: 120, y: 150, size: 80, rotation: 15 },
    ],
  },
  {
    id: "cool-tech",
    label: "Tech & Code",
    bg: "#EBF5FF",
    shapes: [
      { type: "rect", color: "#0A9CD5", x: 20, y: 30, size: 90, rotation: -12 },
      { type: "circle", color: "#A2EFF0", x: 200, y: 60, size: 80 },
      { type: "rect", color: "#a78bfa", x: 100, y: 140, size: 60, rotation: 25 },
    ],
  },
  {
    id: "warm-career",
    label: "Career & Pro",
    bg: "#ECFDF5",
    shapes: [
      { type: "circle", color: "#34d399", x: 40, y: 50, size: 110 },
      { type: "rect", color: "#FEE882", x: 160, y: 30, size: 70, rotation: 10 },
      { type: "triangle", color: "#A2EFF0", x: 80, y: 160, size: 60, rotation: -20 },
    ],
  },
  {
    id: "pink-party",
    label: "Fun & Party",
    bg: "#FFF0F6",
    shapes: [
      { type: "circle", color: "#FFD3EA", x: 60, y: 30, size: 120 },
      { type: "triangle", color: "#FF7151", x: 200, y: 100, size: 70, rotation: 30 },
      { type: "circle", color: "#FEE882", x: 140, y: 170, size: 50 },
    ],
  },
  {
    id: "turquoise-fresh",
    label: "Fresh & Clean",
    bg: "#EBFAF8",
    shapes: [
      { type: "circle", color: "#A2EFF0", x: 50, y: 40, size: 100 },
      { type: "rect", color: "#0A9CD5", x: 180, y: 90, size: 60, rotation: -15 },
      { type: "circle", color: "#FFD3EA", x: 100, y: 160, size: 55 },
    ],
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    bg: "#FFFBEB",
    shapes: [
      { type: "circle", color: "#FEE882", x: 40, y: 35, size: 110 },
      { type: "triangle", color: "#FF7700", x: 180, y: 70, size: 80, rotation: 10 },
      { type: "rect", color: "#FFD3EA", x: 90, y: 150, size: 55, rotation: -8 },
    ],
  },
  {
    id: "artistic",
    label: "Art & Culture",
    bg: "#FFF7ED",
    shapes: [
      { type: "triangle", color: "#FF7700", x: 30, y: 30, size: 100, rotation: 5 },
      { type: "circle", color: "#a78bfa", x: 190, y: 80, size: 75 },
      { type: "rect", color: "#A2EFF0", x: 70, y: 150, size: 65, rotation: 20 },
    ],
  },
  {
    id: "sporty",
    label: "Sports & Active",
    bg: "#EFF6FF",
    shapes: [
      { type: "rect", color: "#60a5fa", x: 30, y: 40, size: 90, rotation: -10 },
      { type: "circle", color: "#34d399", x: 180, y: 50, size: 70 },
      { type: "triangle", color: "#FEE882", x: 120, y: 140, size: 70, rotation: -15 },
    ],
  },
];

function PresetThumbnail({ preset }: { preset: CoverPreset }) {
  return (
    <svg viewBox="0 0 280 200" className="w-full h-full" aria-hidden="true">
      <rect width="280" height="200" rx="8" fill={preset.bg} />
      {preset.shapes.map((shape) => {
        const shapeKey = `${shape.type}-${shape.x}-${shape.y}`;
        const opacity = 0.5;
        if (shape.type === "circle") {
          return (
            <circle
              key={shapeKey}
              cx={shape.x + shape.size / 2}
              cy={shape.y + shape.size / 2}
              r={shape.size / 2}
              fill={shape.color}
              opacity={opacity}
            />
          );
        }
        if (shape.type === "rect") {
          return (
            <rect
              key={shapeKey}
              x={shape.x}
              y={shape.y}
              width={shape.size}
              height={shape.size * 0.6}
              rx={8}
              fill={shape.color}
              opacity={opacity}
              transform={`rotate(${shape.rotation ?? 0} ${shape.x + shape.size / 2} ${shape.y + (shape.size * 0.6) / 2})`}
            />
          );
        }
        // triangle
        const cx = shape.x + shape.size / 2;
        const top = shape.y;
        const bl = `${shape.x},${shape.y + shape.size}`;
        const br = `${shape.x + shape.size},${shape.y + shape.size}`;
        return (
          <polygon
            key={shapeKey}
            points={`${cx},${top} ${bl} ${br}`}
            fill={shape.color}
            opacity={opacity}
            transform={`rotate(${shape.rotation ?? 0} ${cx} ${shape.y + shape.size / 2})`}
          />
        );
      })}
    </svg>
  );
}

interface CoverPresetsPickerProps {
  selected: string | null;
  onSelect: (presetId: string | null) => void;
}

export function CoverPresetsPicker({ selected, onSelect }: CoverPresetsPickerProps) {
  return (
    <div>
      <p className="text-[12px] font-bold font-dm-sans text-forum-dark-gray mb-[8px]">
        Or choose a preset cover
      </p>
      <div className="grid grid-cols-4 gap-[8px]">
        {COVER_PRESETS.map((preset) => {
          const isSelected = selected === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : preset.id)}
              className={cn(
                "relative rounded-[8px] overflow-hidden border-2 transition-all aspect-[7/5]",
                isSelected
                  ? "border-forum-cerulean shadow-md"
                  : "border-transparent hover:border-forum-medium-gray",
              )}
            >
              <PresetThumbnail preset={preset} />
              {isSelected && (
                <div className="absolute top-[4px] right-[4px] w-[18px] h-[18px] rounded-full bg-forum-cerulean flex items-center justify-center">
                  <Check size={11} className="text-white" />
                </div>
              )}
              <p className="absolute bottom-[4px] left-[6px] text-[8px] font-bold font-dm-sans text-forum-dark-gray/70">
                {preset.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Renders a full-size cover from a preset ID (for event cards/detail pages) */
export function PresetCover({
  presetId,
  className = "",
}: { presetId: string; className?: string }) {
  const preset = COVER_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  return (
    <svg viewBox="0 0 280 300" className={className} aria-hidden="true">
      <rect width="280" height="300" rx="14" fill={preset.bg} />
      {preset.shapes.map((shape) => {
        const shapeKey = `${shape.type}-${shape.x}-${shape.y}`;
        const scale = 1.2;
        const opacity = 0.55;
        if (shape.type === "circle") {
          return (
            <circle
              key={shapeKey}
              cx={(shape.x + shape.size / 2) * scale}
              cy={(shape.y + shape.size / 2) * scale}
              r={(shape.size / 2) * scale}
              fill={shape.color}
              opacity={opacity}
            />
          );
        }
        if (shape.type === "rect") {
          const w = shape.size * scale;
          const h = shape.size * 0.6 * scale;
          const sx = shape.x * scale;
          const sy = shape.y * scale;
          return (
            <rect
              key={shapeKey}
              x={sx}
              y={sy}
              width={w}
              height={h}
              rx={10}
              fill={shape.color}
              opacity={opacity}
              transform={`rotate(${shape.rotation ?? 0} ${sx + w / 2} ${sy + h / 2})`}
            />
          );
        }
        const s = shape.size * scale;
        const sx = shape.x * scale;
        const sy = shape.y * scale;
        const cx = sx + s / 2;
        return (
          <polygon
            key={shapeKey}
            points={`${cx},${sy} ${sx},${sy + s} ${sx + s},${sy + s}`}
            fill={shape.color}
            opacity={opacity}
            transform={`rotate(${shape.rotation ?? 0} ${cx} ${sy + s / 2})`}
          />
        );
      })}
    </svg>
  );
}
