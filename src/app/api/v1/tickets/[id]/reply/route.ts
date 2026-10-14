import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { TicketService } from "@/lib/support/ticket-service";
import { UserStore } from "@/lib/auth/user-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const { message } = body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "Message content is required" } },
        { status: 400 }
      );
    }

    const user = UserStore.findById(session.userId);
    const senderName = user?.name || session.name || "User";

    const updatedTicket = TicketService.addMessage(
      id,
      session.userId,
      session.role,
      senderName,
      message.trim()
    );

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to post reply";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
