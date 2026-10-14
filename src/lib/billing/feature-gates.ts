import { UserSubscription } from "@/types";

export interface GateCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPlan?: "starter" | "pro" | "elite";
  upgradeUrl?: string;
}

export class FeatureGates {
  private static isSubscriptionUsable(subscription: UserSubscription): boolean {
    return subscription.status === "ACTIVE" || subscription.status === "TRIALING";
  }

  /**
   * Check if user is allowed to add a new trading account
   */
  static canAddAccount(
    subscription: UserSubscription,
    currentAccountCount: number
  ): GateCheckResult {
    if (!this.isSubscriptionUsable(subscription)) {
      return {
        allowed: false,
        reason: "Your subscription is inactive or past due. Please update billing.",
        upgradeUrl: "/billing",
      };
    }

    if (currentAccountCount >= subscription.plan.maxAccounts) {
      const nextPlan = subscription.plan.slug === "starter" ? "pro" : "elite";
      return {
        allowed: false,
        reason: `Your current plan (${subscription.plan.name}) allows up to ${subscription.plan.maxAccounts} trading accounts. Upgrade to connect more accounts.`,
        requiredPlan: nextPlan,
        upgradeUrl: "/billing",
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user is allowed to log more trades this month
   */
  static canAddTradeThisMonth(
    subscription: UserSubscription,
    tradesThisMonthCount: number
  ): GateCheckResult {
    if (!this.isSubscriptionUsable(subscription)) {
      return {
        allowed: false,
        reason: "Your subscription is inactive or past due. Please update billing.",
        upgradeUrl: "/billing",
      };
    }

    if (tradesThisMonthCount >= subscription.plan.maxTradesPerMonth) {
      const nextPlan = subscription.plan.slug === "starter" ? "pro" : "elite";
      return {
        allowed: false,
        reason: `Monthly limit of ${subscription.plan.maxTradesPerMonth} trades reached. Upgrade to log more trades.`,
        requiredPlan: nextPlan,
        upgradeUrl: "/billing",
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can use CSV / Broker automated imports
   */
  static canUseCsvImport(subscription: UserSubscription): GateCheckResult {
    if (!this.isSubscriptionUsable(subscription)) {
      return {
        allowed: false,
        reason: "Your subscription is inactive. Please renew.",
        upgradeUrl: "/billing",
      };
    }

    if (!subscription.plan.hasCsvImport) {
      return {
        allowed: false,
        reason: "CSV and broker automated imports require a Starter, Pro, or Elite subscription.",
        requiredPlan: "starter",
        upgradeUrl: "/billing",
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can access Advanced Quantitative Analytics & Breakdown dimensions
   */
  static canAccessAdvancedAnalytics(subscription: UserSubscription): GateCheckResult {
    if (!this.isSubscriptionUsable(subscription)) {
      return {
        allowed: false,
        reason: "Your subscription is inactive. Please renew.",
        upgradeUrl: "/billing",
      };
    }

    if (!subscription.plan.hasAdvancedAnalytics) {
      return {
        allowed: false,
        reason: "Multi-dimensional quantitative analytics and mistake leakage ledgers require a Pro or Elite subscription.",
        requiredPlan: "pro",
        upgradeUrl: "/billing",
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can create and track Strategy Playbooks
   */
  static canUsePlaybooks(subscription: UserSubscription): GateCheckResult {
    if (!this.isSubscriptionUsable(subscription)) {
      return {
        allowed: false,
        reason: "Your subscription is inactive. Please renew.",
        upgradeUrl: "/billing",
      };
    }

    if (!subscription.plan.hasPlaybooks) {
      return {
        allowed: false,
        reason: "Strategy Playbooks and Setup win-rate tracking require a Pro or Elite subscription.",
        requiredPlan: "pro",
        upgradeUrl: "/billing",
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can use the AI Trade Mentor
   */
  static canUseAiMentor(subscription: UserSubscription): GateCheckResult {
    if (!this.isSubscriptionUsable(subscription)) {
      return {
        allowed: false,
        reason: "Your subscription is inactive. Please renew.",
        upgradeUrl: "/billing",
      };
    }

    if (!subscription.plan.hasAiMentor) {
      return {
        allowed: false,
        reason: "AI Trade Mentor and automated psychological debriefs require an Elite Institutional subscription.",
        requiredPlan: "elite",
        upgradeUrl: "/billing",
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can use Candlestick Replay canvas
   */
  static canUseReplay(subscription: UserSubscription): GateCheckResult {
    if (!this.isSubscriptionUsable(subscription)) {
      return {
        allowed: false,
        reason: "Your subscription is inactive. Please renew.",
        upgradeUrl: "/billing",
      };
    }

    if (!subscription.plan.hasReplay) {
      return {
        allowed: false,
        reason: "Interactive Candlestick Replay canvas requires a Pro or Elite subscription.",
        requiredPlan: "pro",
        upgradeUrl: "/billing",
      };
    }

    return { allowed: true };
  }
}
