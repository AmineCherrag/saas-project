import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/auth-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await AuthService.resetPassword(body.token, body.newPassword);

    return NextResponse.json({
      success: true,
      data: { message: "Password has been successfully updated. Please sign in." },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Reset failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
