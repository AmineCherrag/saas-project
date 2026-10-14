import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await AuthService.login(body);

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        error: null,
      },
      { status: 200 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set("tradepulse_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "AUTH_ERROR", message },
      },
      { status: 401 }
    );
  }
}
