import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { AccountService } from "@/lib/accounts/account-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    const account = AccountService.getAccountById(session.userId, id);

    return NextResponse.json({
      success: true,
      data: account,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Account not found";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 404 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const updated = AccountService.updateAccount(session.userId, id, body);

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update account";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    AccountService.deleteAccount(session.userId, id);

    return NextResponse.json({
      success: true,
      data: { message: "Account deleted successfully." },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete account";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
