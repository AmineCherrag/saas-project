import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { TradeService } from "@/lib/trades/trade-service";
import { TradeFilters } from "@/lib/trades/validation";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const filters: Partial<TradeFilters> = {
      accountId: searchParams.get("accountId") || undefined,
      assetClass: (searchParams.get("assetClass") as any) || undefined,
      direction: (searchParams.get("direction") as any) || undefined,
      symbol: searchParams.get("symbol") || undefined,
      status: (searchParams.get("status") as any) || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 25,
      sortBy: (searchParams.get("sortBy") as any) || "entryTime",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    };

    const result = TradeService.getTrades(session.userId, filters);

    return NextResponse.json({
      success: true,
      data: result.trades,
      pagination: result.pagination,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load trades";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json();

    const trade = TradeService.createTrade(session.userId, body);

    return NextResponse.json(
      {
        success: true,
        data: trade,
        error: null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create trade";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
