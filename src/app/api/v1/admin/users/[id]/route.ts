import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session-helper";
import { AdminService } from "@/lib/admin/admin-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    if (body.role) {
      if (!["USER", "ADMIN"].includes(body.role)) {
        return NextResponse.json(
          { success: false, data: null, error: { message: "Invalid role value" } },
          { status: 400 }
        );
      }
      AdminService.updateUserRole(id, body.role);
    }

    if (body.planSlug) {
      if (!["starter", "pro", "elite"].includes(body.planSlug)) {
        return NextResponse.json(
          { success: false, data: null, error: { message: "Invalid plan slug" } },
          { status: 400 }
        );
      }
      AdminService.updateUserTier(id, body.planSlug);
    }

    const updatedUsers = AdminService.getAllUsers();
    const targetUser = updatedUsers.find((u) => u.id === id);

    return NextResponse.json({
      success: true,
      data: targetUser,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    const status = message.includes("Forbidden") ? 403 : 401;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}
