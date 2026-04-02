import { FUTURE_COLOR, NOW_COLOR } from "../_lib/map-constants";

interface MapPinProps {
  isNow: boolean;
  count?: number;
  isSelected?: boolean;
}

export function MapPin({ isNow, count, isSelected }: MapPinProps) {
  const color = isNow ? NOW_COLOR : FUTURE_COLOR;
  const hasCount = count !== undefined && count > 1;
  const size = hasCount ? 32 : 26;
  const circleR = hasCount ? 11 : 9;
  const cx = size / 2;
  const cy = 12;

  return (
    <div
      className="relative cursor-pointer"
      style={{
        filter: isSelected
          ? `drop-shadow(0 0 6px ${color}80)`
          : "drop-shadow(0 1px 3px rgba(0,0,0,0.25))",
        transform: isSelected ? "scale(1.15)" : "scale(1)",
        transition: "transform 150ms ease, filter 150ms ease",
      }}
    >
      <svg
        width={size}
        height={size + 6}
        viewBox={`0 0 ${size} ${size + 6}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={hasCount ? `${count} events` : isNow ? "Event happening now" : "Upcoming event"}
      >
        <title>
          {hasCount ? `${count} events` : isNow ? "Event happening now" : "Upcoming event"}
        </title>
        {/* Pin stem */}
        <path
          d={`M${cx} ${cy + circleR}L${cx} ${size + 4}`}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Pin tip dot */}
        <circle cx={cx} cy={size + 4} r="2" fill={color} />
        {/* Main circle */}
        <circle cx={cx} cy={cy} r={circleR} fill={color} stroke="white" strokeWidth="2.5" />
        {/* Count text for multi-event pins */}
        {hasCount && (
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="11"
            fontWeight="700"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
          >
            {count}
          </text>
        )}
      </svg>
      {/* Pulsing ring for NOW events */}
      {isNow && !hasCount && (
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: circleR * 2 + 6,
            height: circleR * 2 + 6,
            top: cy - circleR - 3,
            left: cx - circleR - 3,
            backgroundColor: `${color}20`,
            border: `1px solid ${color}30`,
          }}
        />
      )}
    </div>
  );
}
