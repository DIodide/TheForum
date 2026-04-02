import { FUTURE_COLOR, NOW_COLOR } from "../_lib/map-constants";

export function MapLegend() {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-lg shadow-black/5 border border-gray-200/60 px-3 py-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: NOW_COLOR }}
        />
        <span className="text-xs font-semibold text-gray-600">NOW</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: FUTURE_COLOR }}
        />
        <span className="text-xs font-semibold text-gray-600">FUTURE</span>
      </div>
    </div>
  );
}
