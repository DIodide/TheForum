import { CalendarDays, MapIcon, Sparkles, Users } from "lucide-react";
import { signIn } from "~/auth";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Personalized Feed",
    desc: "Events ranked by your interests, friends, and proximity.",
  },
  {
    icon: Users,
    title: "Friend Activity",
    desc: "See who's going. Discover events through people you trust.",
  },
  {
    icon: CalendarDays,
    title: "One-Tap RSVP",
    desc: "Save, RSVP, and share — all from a single card.",
  },
  {
    icon: MapIcon,
    title: "Campus Map",
    desc: "Browse events by location. See what's happening nearby.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#080d1a]">
      {/* Background grain + gradient */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, #1e3a8a22 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 70%, #6366f118 0%, transparent 60%)",
        }}
      />

      {/* Geometric accent lines */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-[0.04]"
        style={{
          background:
            "conic-gradient(from 45deg, transparent 0deg, #818cf8 90deg, transparent 90deg, transparent 180deg, #818cf8 270deg, transparent 270deg)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-3xl mx-auto text-center">
        {/* Logo */}
        <p
          className="text-sm font-bold tracking-[0.3em] uppercase text-indigo-400 mb-8"
          style={{ fontFamily: "var(--font-unbounded)" }}
        >
          The Forum
        </p>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white mb-5"
          style={{ fontFamily: "var(--font-unbounded)" }}
        >
          Every event.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">
            One campus.
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed mb-10">
          Discover what&apos;s happening at Princeton, see who&apos;s going, and never miss the
          events that matter to you.
        </p>

        {/* CTA */}
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: "/explore" });
          }}
        >
          <button
            type="submit"
            className="group relative px-10 py-4 rounded-2xl text-white font-bold text-base tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #3b82f6, #06b6d4)",
              boxShadow: "0 0 40px rgba(99, 102, 241, 0.3), 0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4)",
              }}
            />
            <span className="relative z-10">Sign in with Princeton</span>
          </button>
        </form>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-2xl">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl p-4 text-left"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Icon size={18} className="text-indigo-400 mb-3" strokeWidth={1.8} />
              <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 inset-x-0 py-5 text-center">
        <p className="text-xs text-slate-600">
          Built for Princeton students
          <span className="mx-2 text-slate-700">·</span>
          The Forum
        </p>
      </footer>
    </main>
  );
}
