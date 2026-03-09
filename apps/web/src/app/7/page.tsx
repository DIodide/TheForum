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
    bg: "#1e1b4b",
    textColor: "white",
  },
  {
    id: "se2",
    title: "Book Donation Drive",
    date: "Feb 25–26",
    bg: "#fef3c7",
    textColor: "#78350f",
  },
  {
    id: "se3",
    title: "First Gen College Students with AI",
    date: "February 10, 5pm",
    bg: "#eff6ff",
    textColor: "#1e40af",
  },
  {
    id: "se4",
    title: "Shrinky Dink & Cookie Seasonal",
    date: "February 15, 3pm",
    bg: "#fef9c3",
    textColor: "#78350f",
  },
];

export default function Page7() {
  return (
    <div
      className="flex flex-col min-h-screen bg-white"
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 tracking-tight">The Forum</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm border border-gray-300 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors text-gray-700"
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
      <div className="px-8 pt-4 pb-2">
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft size={12} />
          Back to Home
        </button>
      </div>

      {/* ── Main event detail ─────────────────────────────────── */}
      <div className="flex gap-8 px-8 py-4 flex-1">
        {/* Left: event flyer */}
        <div className="flex-shrink-0" style={{ width: 320 }}>
          <div
            className="rounded-2xl overflow-hidden flex flex-col justify-between"
            style={{
              width: 320,
              height: 440,
              background: "linear-gradient(135deg, #dc2626 0%, #1e1b4b 60%, #000 100%)",
              padding: 20,
              position: "relative",
            }}
          >
            {/* Title block */}
            <div>
              <p className="text-white font-bold text-lg leading-tight">Spring Beginner</p>
              <p className="text-white font-bold text-lg leading-tight">Workshops</p>
              <div className="mt-3 space-y-2">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white text-xs font-semibold">Intro to Taiko</p>
                  <p className="text-white/70 text-xs">Friday 2/6, 7–9pm</p>
                  <p className="text-white/70 text-xs">McAlpin Room, Woolworth Hall</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white text-xs font-semibold">Odaiko Fundamentals</p>
                  <p className="text-white/70 text-xs">Sunday 2/8, 11:30–1:30pm</p>
                  <p className="text-white/70 text-xs">McAlpin Room</p>
                </div>
              </div>
            </div>

            {/* Vertical "tora taiko" text */}
            <div
              className="absolute right-4 top-0 bottom-0 flex items-center justify-center"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              <span
                className="font-black tracking-widest select-none"
                style={{ fontSize: 40, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}
              >
                tora taiko
              </span>
            </div>

            {/* Bottom: QR + note */}
            <div>
              <div className="bg-white rounded-md" style={{ width: 36, height: 36 }} />
              <p className="text-white/60 text-xs mt-2">No musical experience required</p>
            </div>
          </div>
        </div>

        {/* Right: event info */}
        <div className="flex flex-col flex-1">
          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Share2 size={18} color="#6b7280" strokeWidth={1.8} />
            </button>
            <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Heart size={18} color="#6b7280" strokeWidth={1.8} />
            </button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
            Tora Taiko Beginner Workshops
          </h1>
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">
            Public Event
          </span>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Want to learn tons of fun things by drum? We're holding two beginner workshops to learn
            taiko — the art of Japanese drumming. Come to either or both!
          </p>

          <ul className="space-y-1 mb-4">
            <li className="text-sm text-gray-700">
              • <span className="font-medium">Intro to Taiko</span> — Friday 2/6, 7–9pm, McAlpin
              Room, Woolworth Hall
            </li>
            <li className="text-sm text-gray-700">
              • <span className="font-medium">Odaiko Fundamentals</span> — Sunday 2/8, 11:30–1:30pm,
              McAlpin Room in the Woodworth Music Building
            </li>
          </ul>

          <p className="text-sm text-gray-500 mb-6 italic">
            No musical experience required. See you there!!
          </p>

          {/* RSVP button */}
          <button
            type="button"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ background: "#3b82f6", maxWidth: 380 }}
          >
            RSVP
          </button>

          {/* Attendees */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center">
              {ATTENDEE_COLORS.map(({ id, color }, idx) => (
                <div
                  key={id}
                  className="rounded-full border-2 border-white"
                  style={{
                    width: 26,
                    height: 26,
                    background: color,
                    marginLeft: idx === 0 ? 0 : -8,
                    position: "relative",
                    zIndex: ATTENDEE_COLORS.length - idx,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">9 attending</span>
          </div>
        </div>
      </div>

      {/* ── Similar Events ─────────────────────────────────────── */}
      <div className="px-8 py-8 border-t border-gray-100 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 text-center mb-6">Similar Events</h2>
        <div className="grid grid-cols-4 gap-4">
          {SIMILAR_EVENTS.map(({ id, title, date, bg, textColor }) => (
            <div
              key={id}
              className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              style={{ background: bg }}
            >
              <div className="p-4" style={{ minHeight: 120 }}>
                <p
                  className="text-xs font-semibold leading-tight mb-1"
                  style={{ color: textColor }}
                >
                  {title}
                </p>
                <p className="text-xs opacity-70" style={{ color: textColor }}>
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
