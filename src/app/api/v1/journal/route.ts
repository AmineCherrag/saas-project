import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { JournalService } from "@/lib/journal/journal-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const entries = JournalService.getUserEntries(session.userId);

    return NextResponse.json({
      success: true,
      data: entries,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load journal entries";
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

    if (!body.entryDate) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "Entry date is required (YYYY-MM-DD)." } },
        { status: 400 }
      );
    }

    const entry = JournalService.upsertEntry(session.userId, body);

    return NextResponse.json({
      success: true,
      data: entry,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save journal entry";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
