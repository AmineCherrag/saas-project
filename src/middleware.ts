import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("tradepulse_session");
  const token = sessionCookie?.value?.trim();

  // Protected routes list
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/trades") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/journal") ||
    pathname.startsWith("/playbooks") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin");

  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/trades/:path*",
    "/analytics/:path*",
    "/calendar/:path*",
    "/journal/:path*",
    "/playbooks/:path*",
    "/progress/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
