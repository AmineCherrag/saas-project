import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("tradepulse_session");
  const token = sessionCookie?.value?.trim();

  // Explicit list of all protected route prefixes
  const protectedPrefixes = [
    "/dashboard",
    "/accounts",
    "/trades",
    "/analytics",
    "/calendar",
    "/journal",
    "/playbooks",
    "/progress",
    "/discipline",
    "/billing",
    "/settings",
    "/admin",
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
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
    "/dashboard",
    "/dashboard/:path*",
    "/accounts",
    "/accounts/:path*",
    "/trades",
    "/trades/:path*",
    "/analytics",
    "/analytics/:path*",
    "/calendar",
    "/calendar/:path*",
    "/journal",
    "/journal/:path*",
    "/playbooks",
    "/playbooks/:path*",
    "/progress",
    "/progress/:path*",
    "/discipline",
    "/discipline/:path*",
    "/billing",
    "/billing/:path*",
    "/settings",
    "/settings/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
