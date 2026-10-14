import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { AuthService } from "@/lib/auth/auth-service";

export async function DELETE(request: NextRequest) {
  try {
    const session = requireAuth(request);
    AuthService.deleteAccount(session.userId);

    const response = NextResponse.json({
      success: true,
      data: { message: "Account and all associated records have been permanently deleted." },
      error: null,
    });

    response.cookies.delete("tradepulse_session");
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Deletion failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
