import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { BillingService } from "@/lib/billing/billing-service";

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || "/billing";

    const portal = BillingService.createCustomerPortalSession(session.userId, returnUrl);

    return NextResponse.json({
      success: true,
      data: portal,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to open customer portal";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
