import { SessionProvider } from "next-auth/react";
import { headers } from "next/headers";
import { GeometricBackground } from "~/components/layout/geometric-background";
import { Sidebar } from "~/components/layout/sidebar";
import { TopBar } from "~/components/layout/top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isMapRoute = pathname === "/map";

  return (
    <SessionProvider>
      {isMapRoute ? (
        /* Map route: full-bleed — the map client renders its own floating nav */
        <div className="relative h-screen w-screen overflow-hidden">{children}</div>
      ) : (
        <div className="relative flex h-screen w-screen overflow-hidden bg-white">
          <GeometricBackground />
          <div className="relative z-10 flex w-full h-full">
            <Sidebar />
            <div className="relative flex-1 overflow-hidden">
              <div className="absolute top-0 right-0 z-20">
                <TopBar />
              </div>
              <main className="h-full overflow-y-auto">{children}</main>
            </div>
          </div>
        </div>
      )}
    </SessionProvider>
  );
}
