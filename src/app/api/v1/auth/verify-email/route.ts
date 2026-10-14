import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/auth/auth-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Token parameter is missing." } },
      { status: 400 }
    );
  }

  try {
    AuthService.verifyEmail(token);
    return NextResponse.json({
      success: true,
      data: { message: "Email has been successfully verified." },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
