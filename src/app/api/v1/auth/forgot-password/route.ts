import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = AuthService.requestPasswordReset(body.email);

    return NextResponse.json({
      success: true,
      data: {
        message: "If an account exists for that email, a reset token has been issued.",
        // For development/testing verification only
        devResetToken: process.env.NODE_ENV !== "production" ? token : undefined,
      },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
