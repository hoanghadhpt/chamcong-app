import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/auth";

export function middleware(request: NextRequest) {
  // Allow public routes
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname === "/manifest.webmanifest" ||
    request.nextUrl.pathname.startsWith("/api/auth/") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/sw.js")
  ) {
    return NextResponse.next();
  }

  // Check session for protected routes
  const sessionId = request.cookies.get("sid")?.value;

  if (!sessionId) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = getSession(sessionId);

  if (!session) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("sid");
    return response;
  }

  // Add user ID to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.user_id.toString());

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
     */
    "/((?!public|favicon.ico).*)",
  ],
};
