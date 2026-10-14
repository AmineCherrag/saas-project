import { NextResponse } from "next/server";
import { BillingService } from "@/lib/billing/billing-service";

export async function GET() {
  try {
    const plans = BillingService.getPlans();
    return NextResponse.json({
      success: true,
      data: plans,
      error: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load plans";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 500 }
    );
  }
}
