import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/auth-service";

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("tradepulse_session");
  if (sessionCookie?.value) {
    AuthService.logout(sessionCookie.value);
  }

  const response = NextResponse.json({
    success: true,
    data: { message: "Successfully logged out." },
    error: null,
  });

  // Clear cookie
  response.cookies.delete("tradepulse_session");
  return response;
}
