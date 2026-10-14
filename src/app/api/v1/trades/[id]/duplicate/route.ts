import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { TradeService } from "@/lib/trades/trade-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    const duplicated = TradeService.duplicateTrade(session.userId, id);

    return NextResponse.json(
      {
        success: true,
        data: duplicated,
        error: null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to duplicate trade";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
