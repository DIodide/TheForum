import { SessionProvider } from "next-auth/react";
import { GeometricBackground } from "~/components/layout/geometric-background";
import { Sidebar } from "~/components/layout/sidebar";
import { TopBar } from "~/components/layout/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="relative flex h-screen w-screen overflow-hidden bg-white">
        <GeometricBackground />
        <div className="relative z-10 flex w-full h-full">
          <Sidebar />
          <div className="relative flex-1 overflow-hidden">
            {/* Top bar — positioned absolutely so it doesn't consume vertical space */}
            <div className="absolute top-0 right-0 z-20">
              <TopBar />
            </div>
            <main className="h-full overflow-y-auto">{children}</main>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
