import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { ReportingService } from "@/lib/analytics/reporting-service";
import { TimeRangeFilter } from "@/lib/analytics/analytics-service";

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

    const report = ReportingService.getQuantitativeReport(session.userId, filters);

    return NextResponse.json({
      success: true,
      data: report,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load quantitative reports";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
