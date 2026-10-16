import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { AnalyticsService, TimeRangeFilter } from "@/lib/analytics/analytics-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const filters: TimeRangeFilter = {
      accountId: searchParams.get("accountId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      timeRange: (searchParams.get("timeRange") as any) || "30d",
    };

    const data = AnalyticsService.getDashboardAnalytics(session.userId, filters);

    return NextResponse.json({
      success: true,
      data,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard analytics";
    const status = message.includes("Unauthorized") ? 401 : 400;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}
