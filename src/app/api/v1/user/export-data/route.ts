import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { AuthService } from "@/lib/auth/auth-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const exportBundle = AuthService.exportUserData(session.userId);

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="tradepulse_export_${session.userId}.json"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
