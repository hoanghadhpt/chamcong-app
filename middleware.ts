import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Allow public routes
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/manifest.webmanifest" ||
    request.nextUrl.pathname.startsWith("/api/auth/") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/sw.js") ||
    request.nextUrl.pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Check session cookie existence for protected routes
  // (actual validation happens in API routes to avoid DB calls in edge runtime)
  const sessionId = request.cookies.get("sid")?.value;

  if (!sessionId) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Pass session ID to route handlers for validation
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-session-id", sessionId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - public (public files)
     * - favicon.ico (favicon file)
     * - .next internal files
     */
    "/((?!public|favicon.ico|_next|.*\\..*|sw\\.js).*)",
  ],
};
