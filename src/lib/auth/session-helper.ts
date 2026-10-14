import { NextRequest } from "next/server";
import { AuthService } from "./auth-service";
import { UserSession } from "./types";

export function getSessionFromRequest(request: NextRequest): UserSession | null {
  // 1. Check Authorization Bearer header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const session = AuthService.getSession(token);
    if (session) return session;
  }

  // 2. Check Cookie
  const sessionCookie = request.cookies.get("tradepulse_session");
  if (sessionCookie && sessionCookie.value) {
    const session = AuthService.getSession(sessionCookie.value);
    if (session) return session;
  }

  return null;
}

export function requireAuth(request: NextRequest): UserSession {
  const session = getSessionFromRequest(request);
  if (!session) {
    throw new Error("Unauthorized. Please log in to continue.");
  }
  return session;
}

export function requireAdmin(request: NextRequest): UserSession {
  const session = requireAuth(request);
  if (session.role !== "ADMIN") {
    throw new Error("Forbidden. Administrative privileges required.");
  }
  return session;
}
