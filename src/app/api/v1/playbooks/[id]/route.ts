import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { PlaybookService } from "@/lib/playbooks/playbook-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    const playbook = PlaybookService.getPlaybookById(session.userId, id);

    return NextResponse.json({
      success: true,
      data: playbook,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load playbook";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const updated = PlaybookService.updatePlaybook(session.userId, id, body);

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update playbook";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    const success = PlaybookService.deletePlaybook(session.userId, id);

    return NextResponse.json({
      success,
      data: { id },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete playbook";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
