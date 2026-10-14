import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { ImportService } from "@/lib/importers/import-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = requireAuth(request);
    const { batchId } = await params;

    const result = ImportService.revertBatch(session.userId, batchId);

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to revert import batch";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
