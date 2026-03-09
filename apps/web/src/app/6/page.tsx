import {
  Bell,
  BookmarkPlus,
  CalendarDays,
  Home,
  LogOut,
  Map as MapIcon,
  Search,
  Settings,
  Share2,
  UserCircle,
  Users,
} from "lucide-react";

const NAV = [
  { id: "home", Icon: Home, label: "Home", active: true },
  { id: "events", Icon: CalendarDays, label: "My Events" },
  { id: "map", Icon: MapIcon, label: "Map" },
  { id: "friends", Icon: Users, label: "My Friends" },
];

const FILTER_CIRCLES = [
  { id: "orange", color: "#fb923c", label: "Art" },
  { id: "purple", color: "#a78bfa", label: "STEM" },
  { id: "yellow", color: "#fbbf24", label: "Music" },
  { id: "blue", color: "#60a5fa", label: "Sports" },
  { id: "pink", color: "#f472b6", label: "Social" },
];

const EVENT_CARDS = [
  {
    id: "ec1",
    title: "Spring Dance Workshop",
    date: "Feb 8, 8:30–10:00pm",
    bg: "#1e1b4b",
    accent: "#818cf8",
  },
  { id: "ec2", title: "Book Donation Drive", date: "Feb 25–26", bg: "#fef3c7", accent: "#f59e0b" },
  {
    id: "ec3",
    title: "AI in College Panel",
    date: "Feb 10, 5:00pm",
    bg: "#eff6ff",
    accent: "#3b82f6",
  },
  { id: "ec4", title: "Cookie Social", date: "Feb 15, 3:00pm", bg: "#fef9c3", accent: "#ca8a04" },
  {
    id: "ec5",
    title: "Taiko Drumming Workshop",
    date: "Feb 8, 11:30am",
    bg: "#dc2626",
    accent: "#fca5a5",
  },
  { id: "ec6", title: "Study Session", date: "Feb 12, 7:00pm", bg: "#f0fdf4", accent: "#22c55e" },
];

const RECENTLY_SAVED = [
  {
    id: "rs1",
    title: "Event With Too Many Exclamation Marks!!!",
    from: "From Princeton TigerApps",
    loc: "First Campus Center",
    time: "Fri, Feb 27 at 7:30 PM",
    color: "#dbeafe",
  },
  {
    id: "rs2",
    title: "Dave's Hot Chicken Social",
    from: "From Campus Center",
    loc: "First Campus Center",
    time: "Fri, Feb 27 at 7:30 PM",
    color: "#fce7f3",
  },
  {
    id: "rs3",
    title: "[Event] With the Brackets in Front",
    from: "From Princeton TigerApps",
    loc: "First Campus Center",
    time: "Fri, Feb 27 at 7:30 PM",
    color: "#d1fae5",
  },
];

const FRIENDS = [
  {
    id: "f1",
    name: "Dave's Not Chicken",
    sub: "Angelina, Dalpher + 2 more are going",
    color: "#6366f1",
  },
  { id: "f2", name: "Mary Cecil Dance", sub: "Joshua is going", color: "#ec4899" },
  {
    id: "f3",
    name: "A Capella Arch Sing Event",
    sub: "Brodwell and Andy are going",
    color: "#f97316",
  },
];

export default function Page6() {
  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ fontFamily: "var(--font-inter), sans-serif", background: "#f8fafc" }}
    >
      {/* ── Top Nav ───────────────────────────────────────────── */}
      <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        {/* Search bar */}
        <div
          className="flex items-center gap-2 flex-1 px-4 py-2 rounded-full"
          style={{ background: "#ede9fe", maxWidth: 480 }}
        >
          <Search size={14} color="#7c3aed" strokeWidth={2} />
          <span className="text-sm text-purple-400">
            Search for classes, social, community, talking events
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Settings size={18} color="#6b7280" strokeWidth={1.8} />
          </button>
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Bell size={18} color="#6b7280" strokeWidth={1.8} />
          </button>
          <div
            className="rounded-full bg-indigo-400 text-white flex items-center justify-center font-bold"
            style={{ width: 32, height: 32, fontSize: 13 }}
          >
            A
          </div>
        </div>
      </header>

      {/* ── Filter circles ────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        {FILTER_CIRCLES.map(({ id, color, label }) => (
          <button key={id} type="button" className="flex flex-col items-center gap-1 group">
            <div
              className="rounded-full group-hover:ring-2 ring-offset-1 transition-all"
              style={{ width: 40, height: 40, background: color }}
            />
            <span className="text-xs text-gray-500">{label}</span>
          </button>
        ))}
        <button type="button" className="flex flex-col items-center gap-1 group ml-2">
          <div
            className="rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center"
            style={{ width: 40, height: 40 }}
          >
            <UserCircle size={20} color="#9ca3af" />
          </div>
          <span className="text-xs text-gray-400">More</span>
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Dark left sidebar */}
        <aside
          className="flex flex-col w-48 h-full flex-shrink-0 py-6"
          style={{ background: "#0f172a" }}
        >
          <nav className="flex flex-col gap-1 px-3 flex-1">
            {NAV.map(({ id, Icon, label, active }) => (
              <button
                key={id}
                type="button"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors w-full text-left"
                style={{
                  background: active ? "rgba(99,102,241,0.15)" : "transparent",
                  color: active ? "#818cf8" : "#94a3b8",
                }}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="flex items-center gap-3 px-7 py-3 text-sm text-slate-400 hover:text-slate-200 transition-colors w-full"
          >
            <LogOut size={16} strokeWidth={1.8} />
            Log Out
          </button>
        </aside>

        {/* ── Main event grid ───────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-4">
            {EVENT_CARDS.map(({ id, title, date, bg, accent }) => (
              <div
                key={id}
                className="rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                style={{ background: bg }}
              >
                <div className="h-40 w-full" style={{ background: `${accent}40` }} />
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{title}</p>
                  <p className="text-xs text-gray-500 mt-1">{date}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
                    >
                      <Share2 size={13} color="#9ca3af" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
                    >
                      <BookmarkPlus size={13} color="#9ca3af" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* ── Right panel ──────────────────────────────────── */}
        <aside className="flex flex-col w-80 bg-white border-l border-gray-200 h-full overflow-y-auto flex-shrink-0">
          {/* Recently Saved */}
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Recently Saved</h2>
              <button type="button" className="text-xs text-blue-500 hover:underline">
                View All
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {RECENTLY_SAVED.map(({ id, title, from, loc, time, color }) => (
                <div key={id} className="flex gap-3">
                  <div
                    className="rounded-xl flex-shrink-0"
                    style={{ width: 56, height: 56, background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">
                      {title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{from}</p>
                    <p className="text-xs text-gray-400">{loc}</p>
                    <p className="text-xs text-gray-400">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Friends */}
          <div className="px-5 py-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Friends</h2>
            <div className="flex flex-col gap-4">
              {FRIENDS.map(({ id, name, sub, color }) => (
                <div key={id} className="flex items-start gap-3">
                  <div
                    className="rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ width: 36, height: 36, background: color }}
                  >
                    {name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{sub}</p>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-blue-500 text-center hover:underline mt-1"
              >
                More Friend Events
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
