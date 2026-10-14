import { NextRequest, NextResponse } from "next/server";
import { BillingService } from "@/lib/billing/billing-service";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let event: any;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!event || !event.type || !event.data?.object) {
      return NextResponse.json({ error: "Invalid event object" }, { status: 400 });
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
