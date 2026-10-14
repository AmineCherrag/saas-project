import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { AccountService } from "@/lib/accounts/account-service";
import { AccountStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as AccountStatus | null;

    const accounts = AccountService.getAccountsByUser(session.userId, statusParam || undefined);

    return NextResponse.json({
      success: true,
      data: accounts,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load accounts";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json();

    const account = AccountService.createAccount(session.userId, body);

    return NextResponse.json(
      {
        success: true,
        data: account,
        error: null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
