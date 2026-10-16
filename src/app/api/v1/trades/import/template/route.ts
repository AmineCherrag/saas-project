import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { ImportService } from "@/lib/importers/import-service";

export async function GET(request: NextRequest) {
  try {
    requireAuth(request);
    const { searchParams } = new URL(request.url);
    const broker = searchParams.get("broker") || "universal";

    const template = ImportService.generateTemplate(broker);

    return new NextResponse(template.content, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${template.fileName}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate CSV template";
    const status = message.includes("Unauthorized") ? 401 : 400;
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status }
    );
  }
}
