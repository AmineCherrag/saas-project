import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { PlaybookService } from "@/lib/playbooks/playbook-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const playbooks = PlaybookService.getPlaybooks(session.userId);

    return NextResponse.json({
      success: true,
      data: playbooks,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load playbooks";
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

    const playbook = PlaybookService.createPlaybook(session.userId, body);

    return NextResponse.json(
      {
        success: true,
        data: playbook,
        error: null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create playbook";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
