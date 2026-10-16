import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/lib/billing/billing-service";
import { verifyStripeWebhookSignature } from "@/lib/billing/stripe-helper";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    // Cryptographic signature and replay attack verification
    const validation = verifyStripeWebhookSignature(rawBody, signature);
    if (!validation.isValid || !validation.event) {
      return NextResponse.json(
        { error: validation.error || "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = validation.event;

    if (!event || !event.type || !event.data?.object) {
      return NextResponse.json({ error: "Invalid event object payload" }, { status: 400 });
    }

    const result = BillingService.handleStripeWebhook(event);

    return NextResponse.json({
      received: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
