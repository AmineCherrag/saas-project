import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { TicketService } from "@/lib/support/ticket-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    const isAdmin = session.role === "ADMIN";
    const ticket = TicketService.getTicketById(id, session.userId, isAdmin);

    return NextResponse.json({
      success: true,
      data: ticket,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load ticket";
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

    const { status, assignedAdminId } = body;
    if (!status) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "Status is required" } },
        { status: 400 }
      );
    }

    const ticket = TicketService.updateStatus(id, status, assignedAdminId);

    return NextResponse.json({
      success: true,
      data: ticket,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update ticket";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
