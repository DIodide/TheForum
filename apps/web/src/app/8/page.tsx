import { Bell, ChevronLeft, Heart, Plus, Share2, UserCircle } from "lucide-react";

const ATTENDEE_COLORS = [
  { id: "a1", color: "#22c55e" },
  { id: "a2", color: "#ef4444" },
  { id: "a3", color: "#3b82f6" },
  { id: "a4", color: "#22c55e" },
  { id: "a5", color: "#06b6d4" },
];

const SIMILAR_EVENTS = [
  {
    id: "se1",
    title: "T8 Dance Workshop",
    date: "February 8, 8:30–10:00pm",
    bg: "#0f172a",
    textColor: "white",
  },
  {
    id: "se2",
    title: "Book Donation Drive",
    date: "Feb 25–26",
    bg: "#fffbeb",
    textColor: "#92400e",
  },
  {
    id: "se3",
    title: "First Gen College Students with AI",
    date: "February 10, 5pm",
    bg: "#1e3a8a",
    textColor: "white",
  },
  {
    id: "se4",
    title: "Shrinky Dink & Cookie Seasonal",
    date: "February 15, 3pm",
    bg: "#fefce8",
    textColor: "#854d0e",
  },
];

export default function Page8() {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ fontFamily: "var(--font-inter), sans-serif", background: "#f0f4ff" }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-8 py-4 flex-shrink-0 border-b"
        style={{ background: "white", borderColor: "#e2e8f0" }}
      >
        <span className="text-lg font-bold text-gray-900 tracking-tight">The Forum</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm rounded-full px-4 py-1.5 font-medium hover:opacity-90 transition-opacity"
            style={{ background: "#3b82f6", color: "white" }}
          >
            <Plus size={14} strokeWidth={2} />
            Create Event
          </button>
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Bell size={18} color="#6b7280" strokeWidth={1.8} />
          </button>
          <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <UserCircle size={20} color="#6b7280" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* ── Back link ────────────────────────────────────────── */}
      <div className="px-8 pt-5 pb-2">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium"
        >
          <ChevronLeft size={12} />
          Back to Home
        </button>
      </div>

      {/* ── Main detail ───────────────────────────────────────── */}
      <div className="flex gap-10 px-8 py-4 flex-1">
        {/* Left: event flyer — higher fidelity (deeper blue tint) */}
        <div className="flex-shrink-0" style={{ width: 340 }}>
          <div
            className="rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
            style={{
              width: 340,
              height: 460,
              background: "linear-gradient(135deg, #b91c1c 0%, #1e1b4b 50%, #0f172a 100%)",
              padding: 22,
              position: "relative",
            }}
          >
            <div>
              <p className="text-white font-black text-xl leading-tight drop-shadow-md">
                Spring Beginner
              </p>
              <p className="text-white font-black text-xl leading-tight drop-shadow-md">
                Workshops
              </p>
              <div className="mt-4 space-y-2">
                <div
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                >
                  <p className="text-white text-xs font-bold">Intro to Taiko</p>
                  <p className="text-white/70 text-xs mt-0.5">
                    Friday 2/6, 7–9pm · McAlpin Room, Woolworth Hall
                  </p>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
                >
                  <p className="text-white text-xs font-bold">Odaiko Fundamentals</p>
                  <p className="text-white/70 text-xs mt-0.5">
                    Sunday 2/8, 11:30–1:30pm · McAlpin Room
                  </p>
                </div>
              </div>
            </div>

            {/* Vertical title — more visible */}
            <div
              className="absolute right-5 top-0 bottom-0 flex items-center justify-center"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              <span
                className="font-black tracking-widest select-none"
                style={{ fontSize: 44, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em" }}
              >
                tora taiko
              </span>
            </div>

            <div>
              <div
                className="rounded-md"
                style={{ width: 40, height: 40, background: "rgba(255,255,255,0.9)" }}
              />
              <p className="text-white/50 text-xs mt-2">No musical experience required</p>
            </div>
          </div>
        </div>

        {/* Right: event info */}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-end gap-2 mb-5">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              <Share2 size={13} /> Share
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-red-400 border border-red-100 rounded-full px-3 py-1.5 hover:bg-red-50 transition-colors"
            >
              <Heart size={13} /> Save
            </button>
          </div>

          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-1">
            Tora Taiko Beginner Workshops
          </h1>
          <div className="flex items-center gap-2 mb-5">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: "#dbeafe", color: "#1e40af" }}
            >
              Public Event
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Want to learn tons of fun things by drum? We're holding two beginner workshops to learn
            taiko — the art of Japanese drumming. Come to either or both!
          </p>

          <ul className="space-y-2 mb-5">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-400 font-bold mt-0.5">•</span>
              <span>
                <span className="font-semibold">Intro to Taiko</span> — Friday 2/6, 7–9pm, McAlpin
                Room, Woolworth Hall
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-blue-400 font-bold mt-0.5">•</span>
              <span>
                <span className="font-semibold">Odaiko Fundamentals</span> — Sunday 2/8,
                11:30–1:30pm, McAlpin Room in the Woodworth Music Building
              </span>
            </li>
          </ul>

          <p className="text-sm text-gray-400 italic mb-6">
            No musical experience required. See you there!!
          </p>

          <button
            type="button"
            className="py-3.5 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-blue-200"
            style={{ background: "linear-gradient(90deg, #3b82f6, #6366f1)", maxWidth: 400 }}
          >
            RSVP
          </button>

          <div className="flex items-center gap-3 mt-5">
            <div className="flex items-center">
              {ATTENDEE_COLORS.map(({ id, color }, idx) => (
                <div
                  key={id}
                  className="rounded-full border-2 border-white shadow-sm"
                  style={{
                    width: 30,
                    height: 30,
                    background: color,
                    marginLeft: idx === 0 ? 0 : -10,
                    position: "relative",
                    zIndex: ATTENDEE_COLORS.length - idx,
                  }}
                />
              ))}
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">9 attending</span>
              <p className="text-xs text-gray-400">and growing</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Similar Events ─────────────────────────────────────── */}
      <div className="px-8 py-8 border-t border-blue-100 mt-4">
        <h2 className="text-sm font-bold text-gray-700 text-center mb-6 uppercase tracking-wider">
          Similar Events
        </h2>
        <div className="grid grid-cols-4 gap-5">
          {SIMILAR_EVENTS.map(({ id, title, date, bg, textColor }) => (
            <div
              key={id}
              className="rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow"
              style={{ background: bg }}
            >
              <div className="p-5" style={{ minHeight: 130 }}>
                <p className="text-sm font-bold leading-tight mb-2" style={{ color: textColor }}>
                  {title}
                </p>
                <p className="text-xs font-medium opacity-60" style={{ color: textColor }}>
                  {date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
