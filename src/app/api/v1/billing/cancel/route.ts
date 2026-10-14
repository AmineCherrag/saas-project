import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { BillingService } from "@/lib/billing/billing-service";

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const cancel = body.cancel !== false; // default true

    const updatedSub = cancel
      ? BillingService.cancelSubscription(session.userId)
      : BillingService.resumeSubscription(session.userId);

    return NextResponse.json({
      success: true,
      data: updatedSub,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to change subscription status";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
