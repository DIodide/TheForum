import { SessionProvider } from "next-auth/react";
import { Sidebar } from "~/components/layout/sidebar";
import { TopBar } from "~/components/layout/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafc]">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
