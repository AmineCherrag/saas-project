import { describe, it, expect, beforeEach } from "vitest";
import { BillingService, SUBSCRIPTION_PLANS } from "@/lib/billing/billing-service";
import { BillingStore } from "@/lib/billing/billing-store";
import { FeatureGates } from "@/lib/billing/feature-gates";

describe("Phase 9: Subscription Billing & Payment Gateway Suite", () => {
  const TEST_USER = "usr_tester_billing_01";

  beforeEach(() => {
    BillingStore.clear();
  });

  it("retrieves active subscription plans with tiered pricing", () => {
    const plans = BillingService.getPlans();
    expect(plans.length).toBe(3);

    const starter = plans.find((p) => p.slug === "starter");
    const pro = plans.find((p) => p.slug === "pro");
    const elite = plans.find((p) => p.slug === "elite");

    expect(starter?.priceMonthly).toBe(29);
    expect(starter?.maxAccounts).toBe(2);
    expect(starter?.hasAdvancedAnalytics).toBe(false);

    expect(pro?.priceMonthly).toBe(49);
    expect(pro?.maxAccounts).toBe(10);
    expect(pro?.hasAdvancedAnalytics).toBe(true);
    expect(pro?.hasPlaybooks).toBe(true);

    expect(elite?.priceMonthly).toBe(79);
    expect(elite?.maxAccounts).toBe(50);
    expect(elite?.hasAiMentor).toBe(true);
  });

  it("auto-provisions 14-day Pro Trial for new users", () => {
    const sub = BillingService.getUserSubscription(TEST_USER);

    expect(sub).toBeDefined();
    expect(sub.userId).toBe(TEST_USER);
    expect(sub.plan.slug).toBe("pro");
    expect(sub.status).toBe("TRIALING");
    expect(sub.cancelAtPeriodEnd).toBe(false);

    const now = new Date().getTime();
    const expiry = new Date(sub.currentPeriodEnd).getTime();
    const diffDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(13);
    expect(diffDays).toBeLessThanOrEqual(15);
  });

  it("generates checkout sessions with accurate intervals and amounts", () => {
    const monthlyCheckout = BillingService.createCheckoutSession(TEST_USER, "starter", "monthly");
    expect(monthlyCheckout.sessionId).toContain("cs_test_");
    expect(monthlyCheckout.amount).toBe(29);
    expect(monthlyCheckout.interval).toBe("monthly");

    const yearlyCheckout = BillingService.createCheckoutSession(TEST_USER, "elite", "yearly");
    expect(yearlyCheckout.amount).toBe(759);
    expect(yearlyCheckout.interval).toBe("yearly");
  });

  it("upgrades subscription and generates invoice record", () => {
    const { subscription, invoice } = BillingService.updateSubscription(
      TEST_USER,
      "elite",
      "yearly"
    );

    expect(subscription.plan.slug).toBe("elite");
    expect(subscription.status).toBe("ACTIVE");
    expect(subscription.billingInterval).toBe("yearly");

    expect(invoice).toBeDefined();
    expect(invoice.userId).toBe(TEST_USER);
    expect(invoice.amount).toBe(759);
    expect(invoice.status).toBe("PAID");

    const invoices = BillingService.getUserInvoices(TEST_USER);
    expect(invoices.length).toBe(1);
    expect(invoices[0].id).toBe(invoice.id);
  });

  it("handles cancel subscription and resume subscription requests", () => {
    BillingService.getUserSubscription(TEST_USER);

    const canceled = BillingService.cancelSubscription(TEST_USER);
    expect(canceled.cancelAtPeriodEnd).toBe(true);

    const resumed = BillingService.resumeSubscription(TEST_USER);
    expect(resumed.cancelAtPeriodEnd).toBe(false);
  });

  it("processes Stripe webhook events accurately", () => {
    const webhookUser = "usr_stripe_webhook_target";

    // 1. Checkout completed
    const checkoutEvent = {
      id: "evt_101",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: webhookUser,
          metadata: {
            userId: webhookUser,
            planSlug: "pro",
            interval: "monthly",
          },
        },
      },
    };

    const checkoutRes = BillingService.handleStripeWebhook(checkoutEvent);
    expect(checkoutRes.handled).toBe(true);
    expect(checkoutRes.action).toBe("checkout_completed");

    let sub = BillingService.getUserSubscription(webhookUser);
    expect(sub.plan.slug).toBe("pro");
    expect(sub.status).toBe("ACTIVE");

    // 2. Subscription cancellation webhook
    const deleteEvent = {
      id: "evt_102",
      type: "customer.subscription.deleted",
      data: {
        object: {
          metadata: { userId: webhookUser },
        },
      },
    };

    const deleteRes = BillingService.handleStripeWebhook(deleteEvent);
    expect(deleteRes.handled).toBe(true);

    sub = BillingService.getUserSubscription(webhookUser);
    expect(sub.status).toBe("CANCELED");

    // 3. Payment succeeded invoice
    const invoiceEvent = {
      id: "evt_103",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          id: "inv_stripe_999",
          metadata: { userId: webhookUser },
          amount_paid: 4900,
          currency: "usd",
          lines: {
            data: [{ description: "Pro Trader Monthly Subscription" }],
          },
        },
      },
    };

    const invoiceRes = BillingService.handleStripeWebhook(invoiceEvent);
    expect(invoiceRes.handled).toBe(true);

    const invoices = BillingService.getUserInvoices(webhookUser);
    expect(invoices.some((i) => i.id === "inv_stripe_999")).toBe(true);
  });

  it("enforces FeatureGates correctly across tiers", () => {
    // Test Starter tier restrictions
    const starterSub = {
      id: "sub_1",
      userId: "u1",
      plan: SUBSCRIPTION_PLANS.find((p) => p.slug === "starter")!,
      status: "ACTIVE" as const,
      billingInterval: "monthly" as const,
      currentPeriodEnd: new Date().toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
    };

    // Account limit
    expect(FeatureGates.canAddAccount(starterSub, 1).allowed).toBe(true);
    expect(FeatureGates.canAddAccount(starterSub, 2).allowed).toBe(false);

    // Feature permissions
    expect(FeatureGates.canUseCsvImport(starterSub).allowed).toBe(true);
    expect(FeatureGates.canAccessAdvancedAnalytics(starterSub).allowed).toBe(false);
    expect(FeatureGates.canUsePlaybooks(starterSub).allowed).toBe(false);
    expect(FeatureGates.canUseAiMentor(starterSub).allowed).toBe(false);

    // Test Pro tier permissions
    const proSub = {
      ...starterSub,
      plan: SUBSCRIPTION_PLANS.find((p) => p.slug === "pro")!,
    };
    expect(FeatureGates.canAddAccount(proSub, 5).allowed).toBe(true);
    expect(FeatureGates.canAccessAdvancedAnalytics(proSub).allowed).toBe(true);
    expect(FeatureGates.canUsePlaybooks(proSub).allowed).toBe(true);
    expect(FeatureGates.canUseAiMentor(proSub).allowed).toBe(false);

    // Test Elite tier permissions
    const eliteSub = {
      ...starterSub,
      plan: SUBSCRIPTION_PLANS.find((p) => p.slug === "elite")!,
    };
    expect(FeatureGates.canAddAccount(eliteSub, 40).allowed).toBe(true);
    expect(FeatureGates.canUseAiMentor(eliteSub).allowed).toBe(true);
  });
});
