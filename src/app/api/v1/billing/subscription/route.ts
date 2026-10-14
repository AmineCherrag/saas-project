import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session-helper";
import { BillingService } from "@/lib/billing/billing-service";

export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const subscription = BillingService.getUserSubscription(session.userId);
    const invoices = BillingService.getUserInvoices(session.userId);

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        invoices,
      },
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve subscription";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 401 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = requireAuth(request);
    const body = await request.json();

    const { planSlug, interval } = body;
    if (!planSlug || !["starter", "pro", "elite"].includes(planSlug)) {
      return NextResponse.json(
        { success: false, data: null, error: { message: "Invalid plan slug" } },
        { status: 400 }
      );
    }

    const validInterval = interval === "yearly" ? "yearly" : "monthly";
    const result = BillingService.updateSubscription(session.userId, planSlug, validInterval);

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update subscription";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 400 }
    );
  }
}
