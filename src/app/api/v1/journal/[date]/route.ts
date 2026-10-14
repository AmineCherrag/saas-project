import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { JournalService } from "@/lib/journal/journal-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = requireAuth(request);
    const { date } = await params;

    const detail = JournalService.getDayDetail(session.userId, date);

    return NextResponse.json({
      success: true,
      data: detail,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load day journal detail";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = requireAuth(request);
    const { date } = await params;

    const detail = JournalService.getDayDetail(session.userId, date);
    if (!detail.entry) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "No journal entry found for this date" } },
        { status: 404 }
      );
    }

    const success = JournalService.deleteEntry(session.userId, detail.entry.id);

    return NextResponse.json({
      success,
      data: { id: detail.entry.id },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete journal entry";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
