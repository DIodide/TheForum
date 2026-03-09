import { SessionProvider } from "next-auth/react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex flex-col h-screen w-screen bg-[#f8fafc]">
        {/* Minimal header */}
        <header className="flex items-center px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
          <span
            className="text-lg font-bold text-gray-900 tracking-tight"
            style={{ fontFamily: "var(--font-unbounded)" }}
          >
            The Forum
          </span>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
