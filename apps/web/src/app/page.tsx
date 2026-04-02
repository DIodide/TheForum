import { signIn } from "~/auth";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-white overflow-hidden font-dm-sans">
      {/* ═══ NAV BAR ═══ */}
      <header className="relative z-20 flex items-center justify-between px-[60px] py-[24px]">
        <div className="flex items-baseline gap-0.5">
          <span className="font-serif text-[28px] font-bold italic text-black tracking-tight">
            The For<span className="text-forum-orange italic">um</span>
          </span>
          <span className="text-[9px] text-forum-light-gray ml-1 self-end mb-[5px]">
            by TigerApps
          </span>
        </div>
        <nav className="flex items-center">
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/explore" });
            }}
          >
            <button
              type="submit"
              className="px-[28px] py-[10px] bg-forum-orange text-white text-[13px] font-bold tracking-[0.06em] rounded-[6px] hover:bg-[#e56a00] transition-colors"
            >
              Log In
            </button>
          </form>
        </nav>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative px-[60px] pt-[10px] pb-[100px] min-h-[520px]">
        {/* Geometric background shapes — large, soft, overlapping */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Large turquoise blob — left side, extends from top */}
          <svg
            aria-hidden="true"
            className="absolute -left-[80px] -top-[20px]"
            width="600"
            height="500"
            viewBox="0 0 600 500"
            fill="none"
          >
            <ellipse cx="250" cy="280" rx="320" ry="260" fill="#A2EFF0" fillOpacity="0.35" />
          </svg>
          {/* Big yellow blob — center-right */}
          <svg
            aria-hidden="true"
            className="absolute right-[50px] top-[60px]"
            width="500"
            height="400"
            viewBox="0 0 500 400"
            fill="none"
          >
            <ellipse cx="250" cy="200" rx="250" ry="180" fill="#FEE882" fillOpacity="0.35" />
          </svg>
          {/* Pink circle — top-right */}
          <svg
            aria-hidden="true"
            className="absolute right-[100px] -top-[30px]"
            width="260"
            height="260"
            viewBox="0 0 260 260"
            fill="none"
          >
            <circle cx="130" cy="130" r="130" fill="#FFD3EA" fillOpacity="0.45" />
          </svg>
          {/* Pink triangle — bottom-right */}
          <svg
            aria-hidden="true"
            className="absolute right-[120px] bottom-[10px]"
            width="180"
            height="160"
            viewBox="0 0 180 160"
            fill="none"
          >
            <polygon points="90,0 180,160 0,160" fill="#FF896E" fillOpacity="0.25" />
          </svg>
          {/* Small turquoise triangle — bottom-center */}
          <svg
            aria-hidden="true"
            className="absolute left-[380px] bottom-[40px]"
            width="120"
            height="110"
            viewBox="0 0 120 110"
            fill="none"
          >
            <polygon points="60,0 120,110 0,110" fill="#A2EFF0" fillOpacity="0.25" />
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-[700px]">
          <p className="text-[11px] font-bold tracking-[0.22em] text-black uppercase mb-[24px] flex items-center gap-3">
            <span className="w-[28px] h-[2px] bg-black inline-block" />
            Campus Events Platform — Princeton
          </p>

          <h1 className="font-serif text-[72px] font-bold leading-[0.92] text-black mb-[28px]">
            Your Social
            <br />
            <span className="text-forum-orange italic font-bold">Life, Curated</span>
          </h1>

          <div className="w-[56px] h-[3px] bg-black mb-[28px]" />

          <p className="text-[15.5px] text-black leading-[1.75] mb-[40px] max-w-[580px]">
            Forum brings every campus event worth attending into one{" "}
            <span className="text-forum-orange italic font-bold">beautifully curated</span> feed,
            personalized around you, your friends, and the things you actually love.
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/explore" });
            }}
          >
            <button
              type="submit"
              className="px-[28px] py-[14px] border-[2px] border-black text-black text-[11px] font-bold tracking-[0.22em] uppercase bg-white hover:bg-black hover:text-white transition-all"
            >
              Get Started
            </button>
          </form>
        </div>
      </section>

      {/* ═══ WHAT WE OFFER SECTION ═══ */}
      <section id="discover" className="bg-[#faf8f6] px-[60px] py-[80px]">
        <p className="text-[11px] font-bold tracking-[0.22em] text-black uppercase mb-[18px] flex items-center gap-3">
          <span className="w-[28px] h-[2px] bg-black inline-block" />
          What We Offer
        </p>

        <h2 className="font-serif text-[48px] font-bold leading-[1.08] text-[#c4c0bb] mb-[60px]">
          Everything you need
          <br />
          to never miss <span className="text-forum-orange italic font-bold">a thing</span>
        </h2>

        <div className="max-w-[520px] mx-auto text-center mb-[30px]">
          <p className="font-serif text-[24px] italic text-forum-orange leading-[1.55]">
            &ldquo;Students shouldn&apos;t have to dig through listservs and group chats to find out
            what&apos;s happening on their own campus.
          </p>
          <p className="font-serif text-[24px] italic text-[#c4c0bb] leading-[1.55]">
            The best moments deserve to be discovered.&rdquo;
          </p>
          <div className="w-[2px] h-[28px] bg-forum-orange mx-auto my-[24px]" />
          <p className="text-[11px] font-bold tracking-[0.18em] text-forum-orange uppercase">
            The Forum Team — Princeton TigerApps
          </p>
        </div>
      </section>

      {/* ═══ TWO-COLUMN CARDS ═══ */}
      <section className="flex min-h-[380px]">
        {/* For Students — salmon/coral background */}
        <div className="flex-1 bg-[#F4A08E] px-[50px] py-[55px]">
          <p className="text-[10px] font-bold tracking-[0.22em] text-white/70 uppercase mb-[14px] flex items-center gap-2">
            <span className="w-[24px] h-[1.5px] bg-white/50 inline-block" />
            For Students
          </p>
          <h3 className="font-serif text-[44px] font-bold leading-[1.05] text-white mb-[2px]">
            Your campus
          </h3>
          <h3 className="font-serif text-[44px] italic font-bold leading-[1.05] text-forum-orange mb-[22px]">
            All of it.
          </h3>
          <p className="text-[13.5px] text-white/75 leading-[1.75] mb-[32px] max-w-[340px]">
            Stop hearing about events after the fact. Join Forum and let campus life come to you —
            curated, social, and completely personal.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/explore" });
            }}
          >
            <button
              type="submit"
              className="px-[24px] py-[12px] border-[2px] border-white text-forum-orange text-[10px] font-bold tracking-[0.22em] uppercase bg-white hover:bg-white/90 transition-colors"
            >
              Create Account
            </button>
          </form>
        </div>

        {/* For Org Leaders — light pink background */}
        <div className="flex-1 bg-[#FDE8E4] px-[50px] py-[55px]">
          <p className="text-[13px] font-bold italic text-forum-orange mb-[10px] font-serif">
            For Organization/Club Leaders
          </p>
          <h3 className="font-serif text-[34px] font-bold leading-[1.12] text-[#5a4a3a] mb-[18px]">
            Put your events in front
            <br />
            <span className="text-forum-orange italic">of people who care.</span>
          </h3>
          <p className="text-[13.5px] text-[#8a7a6a] leading-[1.75] mb-[32px] max-w-[360px]">
            Create your organization&apos;s page, publish events in minutes, and reach students
            whose interests actually align with what you&apos;re building.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/events/create" });
            }}
          >
            <button
              type="submit"
              className="px-[24px] py-[12px] border-[2px] border-[#d9d0c8] text-[#b0a090] text-[10px] font-bold tracking-[0.22em] uppercase bg-transparent hover:border-[#a09080] hover:text-[#8a7a6a] transition-colors"
            >
              Post an Event
            </button>
          </form>
        </div>
      </section>

      {/* ═══ FORUM FOOTER WORDMARK ═══ */}
      <section className="bg-[#FDE8E4] px-[60px] pt-[10px] pb-[30px] overflow-hidden text-right">
        <h2 className="font-serif text-[160px] font-bold tracking-[0.08em] text-white/50 leading-none select-none">
          FORUM
        </h2>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-white px-[60px] py-[20px] border-t border-gray-100">
        <p className="text-[11px] text-forum-light-gray">
          Built for Princeton students — The Forum by TigerApps
        </p>
      </footer>
    </main>
  );
}
