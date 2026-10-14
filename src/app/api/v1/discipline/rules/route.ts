import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { DisciplineService } from "@/lib/discipline/discipline-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const rules = DisciplineService.getUserRules(session.userId);

    return NextResponse.json({
      success: true,
      data: rules,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load discipline rules";
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

    const rule = DisciplineService.createRule(session.userId, body);

    return NextResponse.json(
      {
        success: true,
        data: rule,
        error: null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create discipline rule";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
