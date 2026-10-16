import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { TradeService } from "@/lib/trades/trade-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    const trade = TradeService.getTradeById(session.userId, id);

    return NextResponse.json({
      success: true,
      data: trade,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Trade not found";
    const status = message.includes("Unauthorized") ? 401 : 404;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const updated = TradeService.updateTrade(session.userId, id, body);

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update trade";
    const status = message.includes("Unauthorized") ? 401 : 400;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    TradeService.deleteTrade(session.userId, id);

    return NextResponse.json({
      success: true,
      data: { message: "Trade deleted successfully." },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete trade";
    const status = message.includes("Unauthorized") ? 401 : 400;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}
