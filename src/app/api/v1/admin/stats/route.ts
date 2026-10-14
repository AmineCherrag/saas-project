import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session-helper";
import { AdminService } from "@/lib/admin/admin-service";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const stats = AdminService.getAdminStats();
    return NextResponse.json({
      success: true,
      data: stats,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load admin stats";
    const status = message.includes("Forbidden") ? 403 : 401;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}
