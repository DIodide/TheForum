import { auth } from "~/auth";

export const runtime = "nodejs";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isAuthenticated = !!session?.user;
  const pathname = nextUrl.pathname;

  // Public routes — always accessible
  const publicRoutes = ["/", "/api/auth"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) {
    // If authenticated and on landing page, redirect to explore
    if (isAuthenticated && pathname === "/") {
      return Response.redirect(new URL("/explore", nextUrl));
    }
    return;
  }

  // Protected routes — require auth
  if (!isAuthenticated) {
    return Response.redirect(new URL("/", nextUrl));
  }

  // Onboarding guard
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isOnboarded = session.user.onboarded;

  if (!isOnboarded && !isOnboardingRoute) {
    return Response.redirect(new URL("/onboarding", nextUrl));
  }

  if (isOnboarded && isOnboardingRoute) {
    return Response.redirect(new URL("/explore", nextUrl));
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
