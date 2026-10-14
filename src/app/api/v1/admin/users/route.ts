import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session-helper";
import { AdminService } from "@/lib/admin/admin-service";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const users = AdminService.getAllUsers();
    return NextResponse.json({
      success: true,
      data: users,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load users";
    const status = message.includes("Forbidden") ? 403 : 401;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}
