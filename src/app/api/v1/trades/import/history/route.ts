import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { ImportService } from "@/lib/importers/import-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const history = ImportService.getImportHistory(session.userId);

    return NextResponse.json({
      success: true,
      data: history,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch import history";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
