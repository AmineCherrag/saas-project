import crypto from "crypto";
import { SubscriptionPlan, UserSubscription, InvoiceRecord, SubscriptionStatus } from "@/types";
import { BillingStore } from "./billing-store";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan_starter",
    name: "Starter Trader",
    slug: "starter",
    priceMonthly: 29,
    priceYearly: 279, // ~20% discount
    maxAccounts: 2,
    maxTradesPerMonth: 100,
    hasCsvImport: true,
    hasAdvancedAnalytics: false,
    hasPlaybooks: false,
    hasAiMentor: false,
    hasReplay: false,
    isActive: true,
  },
  {
    id: "plan_pro",
    name: "Pro Trader",
    slug: "pro",
    priceMonthly: 49,
    priceYearly: 469, // ~20% discount
    maxAccounts: 10,
    maxTradesPerMonth: 1000,
    hasCsvImport: true,
    hasAdvancedAnalytics: true,
    hasPlaybooks: true,
    hasAiMentor: false,
    hasReplay: true,
    isActive: true,
  },
  {
    id: "plan_elite",
    name: "Elite Institutional",
    slug: "elite",
    priceMonthly: 79,
    priceYearly: 759, // ~20% discount
    maxAccounts: 50,
    maxTradesPerMonth: 50000,
    hasCsvImport: true,
    hasAdvancedAnalytics: true,
    hasPlaybooks: true,
    hasAiMentor: true,
    hasReplay: true,
    isActive: true,
  },
];

export class BillingService {
  /**
   * Retrieve all active subscription plans
   */
  static getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS.filter((p) => p.isActive);
  }

  /**
   * Find a plan by its unique slug
   */
  static getPlanBySlug(slug: "starter" | "pro" | "elite"): SubscriptionPlan {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.slug === slug);
    if (!plan) {
      throw new Error(`Plan with slug '${slug}' not found.`);
    }
    return plan;
  }

  /**
   * Retrieve or auto-provision a default 14-day Pro Trial for a user
   */
  static getUserSubscription(userId: string): UserSubscription {
    const existing = BillingStore.getSubscription(userId);
    if (existing) {
      // Check if trial period has ended
      if (existing.status === "TRIALING" && existing.currentPeriodEnd) {
        if (new Date(existing.currentPeriodEnd).getTime() < Date.now()) {
          const expired: UserSubscription = {
            ...existing,
            status: "EXPIRED",
          };
          BillingStore.upsertSubscription(expired);
          return expired;
        }
      }
      return existing;
    }

    // Auto-provision 14-day Pro Trial
    const proPlan = this.getPlanBySlug("pro");
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const newSub: UserSubscription = {
      id: `sub_${crypto.randomUUID()}`,
      userId,
      plan: proPlan,
      status: "TRIALING",
      billingInterval: "monthly",
      stripeCustomerId: `cus_${crypto.randomBytes(8).toString("hex")}`,
      stripeSubscriptionId: `sub_trial_${crypto.randomBytes(8).toString("hex")}`,
      currentPeriodEnd: trialEnd.toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: now.toISOString(),
    };

    BillingStore.upsertSubscription(newSub);
    return newSub;
  }

  /**
   * Create a simulated Stripe Checkout session
   */
  static createCheckoutSession(
    userId: string,
    planSlug: "starter" | "pro" | "elite",
    interval: "monthly" | "yearly" = "monthly",
    successUrl?: string,
    cancelUrl?: string
  ): {
    sessionId: string;
    url: string;
    plan: SubscriptionPlan;
    interval: "monthly" | "yearly";
    amount: number;
  } {
    const plan = this.getPlanBySlug(planSlug);
    const amount = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
    const sessionId = `cs_test_${crypto.randomBytes(12).toString("hex")}`;

    const url =
      successUrl ||
      `/billing?session_id=${sessionId}&plan=${planSlug}&interval=${interval}&success=true`;

    return {
      sessionId,
      url,
      plan,
      interval,
      amount,
    };
  }

  /**
   * Create a simulated Stripe Customer Portal session
   */
  static createCustomerPortalSession(userId: string, returnUrl?: string): { url: string } {
    return {
      url: returnUrl || `/billing?portal=true`,
    };
  }

  /**
   * Upgrade or modify user's subscription and generate an invoice record
   */
  static updateSubscription(
    userId: string,
    planSlug: "starter" | "pro" | "elite",
    interval: "monthly" | "yearly" = "monthly",
    status: SubscriptionStatus = "ACTIVE"
  ): { subscription: UserSubscription; invoice: InvoiceRecord } {
    const plan = this.getPlanBySlug(planSlug);
    const existingSub = this.getUserSubscription(userId);

    const now = new Date();
    const durationDays = interval === "yearly" ? 365 : 30;
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const amount = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;

    const updatedSub: UserSubscription = {
      ...existingSub,
      plan,
      status,
      billingInterval: interval,
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
    };

    BillingStore.upsertSubscription(updatedSub);

    // Create an invoice record
    const invoiceId = `inv_${crypto.randomBytes(8).toString("hex")}`;
    const invoice: InvoiceRecord = {
      id: invoiceId,
      userId,
      amount,
      currency: "USD",
      status: "PAID",
      planName: `${plan.name} (${interval === "yearly" ? "Annual" : "Monthly"})`,
      date: now.toISOString(),
      pdfUrl: `/api/v1/billing/invoices/${invoiceId}.pdf`,
    };

    BillingStore.createInvoice(invoice);

    return { subscription: updatedSub, invoice };
  }

  /**
   * Cancel subscription at current period end
   */
  static cancelSubscription(userId: string): UserSubscription {
    const sub = this.getUserSubscription(userId);
    const updatedSub: UserSubscription = {
      ...sub,
      cancelAtPeriodEnd: true,
    };
    BillingStore.upsertSubscription(updatedSub);
    return updatedSub;
  }

  /**
   * Resume a canceled subscription
   */
  static resumeSubscription(userId: string): UserSubscription {
    const sub = this.getUserSubscription(userId);
    const updatedSub: UserSubscription = {
      ...sub,
      cancelAtPeriodEnd: false,
    };
    BillingStore.upsertSubscription(updatedSub);
    return updatedSub;
  }

  /**
   * Get past invoices for a user
   */
  static getUserInvoices(userId: string): InvoiceRecord[] {
    return BillingStore.getInvoicesByUserId(userId);
  }

  /**
   * Handle incoming Stripe webhook events
   */
  static handleStripeWebhook(event: {
    id: string;
    type: string;
    data: {
      object: any;
    };
  }): { handled: boolean; action: string; details?: any } {
    const obj = event.data.object;

    switch (event.type) {
      case "checkout.session.completed": {
        const userId = obj.client_reference_id || obj.metadata?.userId;
        const planSlug = (obj.metadata?.planSlug || "pro") as "starter" | "pro" | "elite";
        const interval = (obj.metadata?.interval || "monthly") as "monthly" | "yearly";

        if (!userId) {
          return { handled: false, action: "missing_user_id" };
        }

        const result = this.updateSubscription(userId, planSlug, interval, "ACTIVE");
        return { handled: true, action: "checkout_completed", details: result };
      }

      case "customer.subscription.updated": {
        const userId = obj.metadata?.userId;
        if (!userId) {
          return { handled: false, action: "missing_user_id" };
        }

        const sub = this.getUserSubscription(userId);
        const statusMap: Record<string, SubscriptionStatus> = {
          active: "ACTIVE",
          trialing: "TRIALING",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          incomplete: "INCOMPLETE",
          unpaid: "UNPAID",
        };

        const newStatus = statusMap[obj.status] || "ACTIVE";
        const cancelAtPeriodEnd = !!obj.cancel_at_period_end;

        const updated: UserSubscription = {
          ...sub,
          status: newStatus,
          cancelAtPeriodEnd,
          currentPeriodEnd: obj.current_period_end
            ? new Date(obj.current_period_end * 1000).toISOString()
            : sub.currentPeriodEnd,
        };

        BillingStore.upsertSubscription(updated);
        return { handled: true, action: "subscription_updated", details: updated };
      }

      case "customer.subscription.deleted": {
        const userId = obj.metadata?.userId;
        if (!userId) {
          return { handled: false, action: "missing_user_id" };
        }

        const sub = this.getUserSubscription(userId);
        const updated: UserSubscription = {
          ...sub,
          status: "CANCELED",
          cancelAtPeriodEnd: false,
        };

        BillingStore.upsertSubscription(updated);
        return { handled: true, action: "subscription_deleted", details: updated };
      }

      case "invoice.payment_succeeded": {
        const userId = obj.metadata?.userId || obj.customer_metadata?.userId;
        if (!userId) {
          return { handled: false, action: "missing_user_id" };
        }

        const invoiceId = obj.id || `inv_${crypto.randomBytes(8).toString("hex")}`;
        const invoice: InvoiceRecord = {
          id: invoiceId,
          userId,
          amount: (obj.amount_paid || 0) / 100,
          currency: (obj.currency || "usd").toUpperCase(),
          status: "PAID",
          planName: obj.lines?.data?.[0]?.description || "Subscription Renewal",
          date: new Date().toISOString(),
          pdfUrl: obj.invoice_pdf || `/api/v1/billing/invoices/${invoiceId}.pdf`,
        };

        BillingStore.createInvoice(invoice);
        return { handled: true, action: "invoice_payment_succeeded", details: invoice };
      }

      case "invoice.payment_failed": {
        const userId = obj.metadata?.userId;
        if (userId) {
          const sub = this.getUserSubscription(userId);
          const updated: UserSubscription = {
            ...sub,
            status: "PAST_DUE",
          };
          BillingStore.upsertSubscription(updated);
        }
        return { handled: true, action: "invoice_payment_failed" };
      }

      default:
        return { handled: true, action: `unhandled_event_${event.type}` };
    }
  }
}
