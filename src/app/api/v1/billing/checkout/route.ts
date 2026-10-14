import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { BillingService } from "@/lib/billing/billing-service";

export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json();

    const { planSlug, interval = "monthly", directUpgrade = false } = body;

    if (!planSlug || !["starter", "pro", "elite"].includes(planSlug)) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "Invalid plan slug" } },
        { status: 400 }
      );
    }

    const validInterval = interval === "yearly" ? "yearly" : "monthly";

    if (directUpgrade) {
      // Direct mock upgrade for interactive prototype / test environments
      const result = BillingService.updateSubscription(session.userId, planSlug, validInterval);
      return NextResponse.json({
        success: true,
        data: {
          upgraded: true,
          subscription: result.subscription,
          invoice: result.invoice,
        },
        error: null,
      });
    }

    const checkoutSession = BillingService.createCheckoutSession(
      session.userId,
      planSlug,
      validInterval
    );

    return NextResponse.json({
      success: true,
      data: checkoutSession,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initiate checkout";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
