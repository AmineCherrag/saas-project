import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await AuthService.register(body);

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        error: null,
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set("tradepulse_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "REGISTRATION_ERROR", message },
      },
      { status: 400 }
    );
  }
}
