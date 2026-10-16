import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { AnalyticsService } from "@/lib/analytics/analytics-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const currentYearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    const month = searchParams.get("month") || currentYearMonth;
    const accountId = searchParams.get("accountId") || undefined;

    const data = AnalyticsService.getCalendarAnalytics(session.userId, month, accountId);

    return NextResponse.json({
      success: true,
      data,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load calendar analytics";
    const status = message.includes("Unauthorized") ? 401 : 400;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}
