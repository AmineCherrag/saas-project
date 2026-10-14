import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { DisciplineService } from "@/lib/discipline/discipline-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const scoreData = DisciplineService.getDisciplineScore(session.userId);

    return NextResponse.json({
      success: true,
      data: scoreData,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load discipline score";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
