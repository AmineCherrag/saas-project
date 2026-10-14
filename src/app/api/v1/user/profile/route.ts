import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { UserStore } from "@/lib/auth/user-store";
import { AuthService } from "@/lib/auth/auth-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const user = UserStore.findById(session.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        baseCurrency: user.baseCurrency,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json();

    const updated = AuthService.updateProfile(session.userId, body);

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        baseCurrency: updated.baseCurrency,
        timezone: updated.timezone,
        avatarUrl: updated.avatarUrl,
      },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 400 }
    );
  }
}
