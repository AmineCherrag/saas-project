import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { DisciplineService } from "@/lib/discipline/discipline-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().substring(0, 10);
    const date = searchParams.get("date") || today;

    const checklist = DisciplineService.getDailyChecklist(session.userId, date);

    return NextResponse.json({
      success: true,
      data: checklist,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load discipline logs";
    const status = message.includes("Unauthorized") ? 401 : 400;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json();

    const log = DisciplineService.setLog(session.userId, body);

    return NextResponse.json({
      success: true,
      data: log,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save discipline log";
    const status = message.includes("Unauthorized") ? 401 : 400;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}
