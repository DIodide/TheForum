import {
  CalendarDays,
  Globe,
  Heart,
  MessageCircle,
  Newspaper,
  UserCircle,
  Users,
} from "lucide-react";

// ── Sidebar ───────────────────────────────────────────────────
const NAV = [
  { id: "feeds", Icon: Newspaper, label: "Feeds" },
  { id: "event", Icon: CalendarDays, label: "Event", badge: 3 },
  { id: "charity", Icon: Heart, label: "Charity" },
  { id: "friends", Icon: Users, label: "Friends" },
  { id: "community", Icon: MessageCircle, label: "Community" },
];

const FOLLOWING = [
  { id: "u1", name: "Shiqara Miramini", color: "#6366f1" },
  { id: "u2", name: "Charlie Zapln", color: "#ec4899" },
  { id: "u3", name: "Pope Francis", color: "#f97316" },
  { id: "u4", name: "Donald Drump", color: "#22c55e" },
  { id: "u5", name: "Elvis Presley", color: "#3b82f6" },
];

// ── Top tabs ──────────────────────────────────────────────────
const TABS = [
  { id: "community", label: "Community", Icon: Globe },
  { id: "friends", label: "Friends", Icon: Users, active: true },
  { id: "event", label: "Event", Icon: CalendarDays },
  { id: "profile", label: "Profile", Icon: UserCircle },
];

// ── My Events cards ───────────────────────────────────────────
const MY_EVENTS = [
  {
    id: "me1",
    title: "TigerApps Meeting",
    date: "Wed, 2 Jan, 2026",
    badge: "1-2B",
    time: "3:00 PM – 5:30 PM",
    bg: "#ede9fe",
  },
  {
    id: "me2",
    title: "TigerApps Meeting",
    date: "Wed, 2 Jan, 2026",
    badge: "1-2B",
    time: "3:00 PM – 5:30 PM",
    bg: "#fce7f3",
  },
  {
    id: "me3",
    title: "TigerApps Meeting",
    date: "Wed, 2 Jan, 2026",
    badge: "1-2B",
    time: "3:00 PM – 5:30 PM",
    bg: "#d1fae5",
  },
];

// ── Calendar ──────────────────────────────────────────────────
const CAL_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const CAL_DATES = [
  [null, null, null, null, null, 1, 2],
  [3, 4, 5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23],
  [24, 25, 26, 27, 28, 29, 30],
];
const DOTTED_DAYS = new Set([5, 12, 19, 26]);
const TODAY_CAL = 26;

// ── Friends panel ─────────────────────────────────────────────
const FRIENDS = [
  { id: "f1", name: "Albert Shu", mutual: 2, color: "#6366f1" },
  { id: "f2", name: "Friend 3", mutual: 5, color: "#ec4899" },
  { id: "f3", name: "Friend 5", mutual: 3, color: "#f97316" },
  { id: "f4", name: "Friend 6", mutual: 1, color: "#22c55e" },
];

export default function Page5() {
  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-gray-50"
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      {/* ── Left Sidebar ────────────────────────────────────── */}
      <aside className="flex flex-col w-52 bg-white border-r border-gray-200 h-full flex-shrink-0">
        <div className="flex flex-col items-center pt-8 pb-4 border-b border-gray-100">
          <div
            className="rounded-full bg-indigo-400 flex items-center justify-center text-white font-bold text-xl"
            style={{ width: 56, height: 56 }}
          >
            A
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-800">Albert</p>
          <p className="text-xs text-gray-400">Princeton University</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV.map(({ id, Icon, label, badge }) => (
            <button
              key={id}
              type="button"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors w-full text-left"
            >
              <Icon size={16} strokeWidth={1.8} />
              <span className="text-sm flex-1">{label}</span>
              {badge !== undefined && (
                <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-1 px-3 pb-4 border-t border-gray-100 pt-4 mt-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Following
          </p>
          {FOLLOWING.map(({ id, name, color }) => (
            <div key={id} className="flex items-center gap-2 px-3 py-1.5">
              <div
                className="rounded-full flex-shrink-0 text-white flex items-center justify-center text-xs font-bold"
                style={{ width: 26, height: 26, background: color }}
              >
                {name[0]}
              </div>
              <span className="text-xs text-gray-600 truncate">{name}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar with tabs */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hello Albert,</h1>
            <p className="text-sm text-gray-500">Today is Tuesday, 17 February 2026</p>
          </div>
          <div className="flex items-center gap-1">
            {TABS.map(({ id, label, Icon, active }) => (
              <button
                key={id}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors"
                style={{
                  background: active ? "#1e40af" : "transparent",
                  color: active ? "white" : "#6b7280",
                }}
              >
                <Icon size={14} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* My Events */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">My Events</h2>
          <div className="flex gap-4 mb-6">
            {MY_EVENTS.map(({ id, title, date, badge, time, bg }) => (
              <div
                key={id}
                className="flex flex-col gap-2 rounded-xl p-4 flex-1"
                style={{ background: bg }}
              >
                <div className="rounded-lg bg-white/50 w-full" style={{ height: 100 }} />
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{date}</span>
                  <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded-full text-red-500 font-medium">
                    {badge}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{time}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Right Panel ──────────────────────────────────────── */}
      <aside className="flex flex-col w-72 bg-white border-l border-gray-200 h-full overflow-y-auto flex-shrink-0">
        {/* Calendar */}
        <div className="px-5 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Calendar View</h2>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-700">June 2026</span>
            <div className="flex gap-1">
              <button type="button" className="text-gray-400 text-xs px-1">
                ‹
              </button>
              <button type="button" className="text-gray-400 text-xs px-1">
                ›
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {CAL_DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          {CAL_DATES.map((week, wi) => (
            <div key={`week-${wi + 1}`} className="grid grid-cols-7 mb-0.5">
              {week.map((day, di) => (
                <div
                  key={day !== null ? `day-${day}` : `empty-${wi}-${di}`}
                  className="flex flex-col items-center py-0.5"
                >
                  {day !== null && (
                    <>
                      <div
                        className="flex items-center justify-center rounded-full text-xs"
                        style={{
                          width: 24,
                          height: 24,
                          background: day === TODAY_CAL ? "#3b82f6" : "transparent",
                          color: day === TODAY_CAL ? "white" : "#374151",
                          fontWeight: day === TODAY_CAL ? 600 : 400,
                        }}
                      >
                        {day}
                      </div>
                      {DOTTED_DAYS.has(day) && (
                        <div
                          className="rounded-full bg-green-400 mt-0.5"
                          style={{ width: 4, height: 4 }}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Friends */}
        <div className="px-5 py-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Friends</h2>
          <div className="flex flex-col gap-3">
            {FRIENDS.map(({ id, name, mutual, color }) => (
              <div key={id} className="flex items-center gap-3">
                <div
                  className="rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ width: 36, height: 36, background: color }}
                >
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                  <p className="text-xs text-gray-400">{mutual} mutual friends</p>
                </div>
                <button
                  type="button"
                  className="text-xs text-blue-500 border border-blue-200 rounded-full px-2 py-1 hover:bg-blue-50 transition-colors"
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
