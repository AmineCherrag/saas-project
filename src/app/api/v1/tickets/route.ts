import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { TicketService } from "@/lib/support/ticket-service";
import { UserStore } from "@/lib/auth/user-store";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const { searchParams } = new URL(request.url);

    const isAdmin = session.role === "ADMIN";
    const status = (searchParams.get("status") as any) || undefined;
    const priority = (searchParams.get("priority") as any) || undefined;
    const category = (searchParams.get("category") as any) || undefined;

    // Normal users only see their own tickets; admins see all (or filtered by userId)
    const userId = isAdmin ? searchParams.get("userId") || undefined : session.userId;

    const tickets = TicketService.getTickets({
      userId,
      status,
      priority,
      category,
    });

    return NextResponse.json({
      success: true,
      data: tickets,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load tickets";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json();

    const { category, priority = "MEDIUM", subject, message } = body;

    if (!category || !subject || !message) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "Category, subject, and message are required" } },
        { status: 400 }
      );
    }

    const user = UserStore.findById(session.userId);
    const userEmail = user?.email || session.email || "trader@tradepulse.io";
    const userName = user?.name || session.name || "Trader";

    const ticket = TicketService.createTicket(
      session.userId,
      userEmail,
      userName,
      category,
      priority,
      subject,
      message
    );

    return NextResponse.json(
      {
        success: true,
        data: ticket,
        error: null,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create ticket";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
