import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { ImportService } from "@/lib/importers/import-service";

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const contentType = request.headers.get("content-type") || "";

    let accountId = "";
    let fileName = "imported_trades.csv";
    let csvContent = "";
    let brokerPreset = "auto";
    let customMapping: any = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      accountId = (formData.get("accountId") as string) || "";
      brokerPreset = (formData.get("brokerPreset") as string) || "auto";

      const rawMapping = formData.get("customMapping") as string | null;
      if (rawMapping) {
        try {
          customMapping = JSON.parse(rawMapping);
        } catch {}
      }

      if (!file) {
        return NextResponse.json(
          { success: false, data: null, error: { message: "No CSV file uploaded." } },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, data: null, error: { message: "Uploaded file exceeds maximum limit of 10MB." } },
          { status: 413 }
        );
      }

      fileName = file.name;
      if (!fileName.toLowerCase().endsWith(".csv") && !fileName.toLowerCase().endsWith(".txt")) {
        return NextResponse.json(
          { success: false, data: null, error: { message: "Invalid file format. Only .csv and .txt broker reports are accepted." } },
          { status: 400 }
        );
      }

      csvContent = await file.text();
    } else {
      const body = await request.json();
      accountId = body.accountId;
      fileName = body.fileName || "imported_trades.csv";
      csvContent = body.csvContent;
      brokerPreset = body.brokerPreset || "auto";
      customMapping = body.customMapping;
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "Trading account ID is required." } },
        { status: 400 }
      );
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "CSV content cannot be empty." } },
        { status: 400 }
      );
    }

    if (csvContent.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "CSV content exceeds maximum limit of 10MB." } },
        { status: 413 }
      );
    }

    const preview = ImportService.previewImport(
      session.userId,
      accountId,
      fileName,
      csvContent,
      brokerPreset,
      customMapping
    );

    return NextResponse.json({
      success: true,
      data: preview,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate CSV import preview";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
