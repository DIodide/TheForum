import { SessionProvider } from "next-auth/react";
import { GeometricBackground } from "~/components/layout/geometric-background";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="relative flex flex-col h-screen w-screen bg-white overflow-hidden">
        <GeometricBackground />
        <main className="relative z-10 flex-1 overflow-y-auto flex items-center justify-center">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
