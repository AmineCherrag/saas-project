import {
  AdminStats,
  UserRole,
  SubscriptionStatus,
} from "@/types";
import { UserStore, AuditLogEntry } from "@/lib/auth/user-store";
import { BillingStore } from "@/lib/billing/billing-store";
import { BillingService } from "@/lib/billing/billing-service";
import { TradeStore } from "@/lib/trades/trade-store";
import { AccountStore } from "@/lib/accounts/account-store";
import { TicketStore } from "@/lib/support/ticket-store";

export interface AdminUserView {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: SubscriptionStatus;
  planSlug: "starter" | "pro" | "elite";
  planName: string;
  billingInterval: "monthly" | "yearly";
  accountCount: number;
  tradeCount: number;
  createdAt: string;
}

export class AdminService {
  /**
   * Aggregate SaaS executive performance metrics
   */
  static getAdminStats(): AdminStats {
    const subscriptions = BillingStore.getAllSubscriptions();
    const trades = TradeStore.getAll();
    const accounts = AccountStore.getAll();
    const tickets = TicketStore.getTickets();

    // 1. Calculate MRR
    let mrr = 0;
    let activeSubscribers = 0;
    let trialingSubscribers = 0;
    let canceledSubscribers = 0;

    for (const sub of subscriptions) {
      if (sub.status === "ACTIVE") {
        activeSubscribers++;
        const monthlyRate =
          sub.billingInterval === "yearly"
            ? sub.plan.priceYearly / 12
            : sub.plan.priceMonthly;
        mrr += monthlyRate;
      } else if (sub.status === "TRIALING") {
        trialingSubscribers++;
      } else if (sub.status === "CANCELED") {
        canceledSubscribers++;
      }
    }

    const totalSubscribers = subscriptions.length;
    const churnRate =
      totalSubscribers > 0
        ? Math.round((canceledSubscribers / totalSubscribers) * 100 * 10) / 10
        : 0;

    const openTicketsCount = tickets.filter(
      (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
    ).length;

    return {
      mrr: Math.round(mrr * 100) / 100,
      totalSubscribers,
      activeSubscribers,
      trialingSubscribers,
      churnRate,
      totalTradesLogged: trades.length,
      totalAccountsConnected: accounts.length,
      openTicketsCount,
    };
  }

  /**
   * Retrieve list of all registered platform users with tier info
   */
  static getAllUsers(): AdminUserView[] {
    const users = UserStore.getAllUsers();
    const trades = TradeStore.getAll();
    const accounts = AccountStore.getAll();

    return users.map((u) => {
      const sub = BillingService.getUserSubscription(u.id);
      const userAccounts = accounts.filter((a) => a.userId === u.id);
      const userTrades = trades.filter((t) => t.userId === u.id);

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: sub.status,
        planSlug: sub.plan.slug,
        planName: sub.plan.name,
        billingInterval: sub.billingInterval,
        accountCount: userAccounts.length,
        tradeCount: userTrades.length,
        createdAt: u.createdAt,
      };
    });
  }

  /**
   * Update a user's security role (USER / ADMIN)
   */
  static updateUserRole(userId: string, newRole: UserRole): boolean {
    const updated = UserStore.update(userId, { role: newRole });
    if (updated) {
      UserStore.logAudit({
        userId,
        action: "ADMIN_ROLE_CHANGE",
        details: { newRole },
      });
      return true;
    }
    return false;
  }

  /**
   * Override a user's subscription tier directly from the admin panel
   */
  static updateUserTier(
    userId: string,
    planSlug: "starter" | "pro" | "elite"
  ): AdminUserView | null {
    BillingService.updateSubscription(userId, planSlug, "monthly", "ACTIVE");
    UserStore.logAudit({
      userId,
      action: "ADMIN_TIER_OVERRIDE",
      details: { planSlug },
    });

    const user = UserStore.findById(userId);
    if (!user) return null;

    const sub = BillingService.getUserSubscription(userId);
    const trades = TradeStore.findByUserId(userId);
    const accounts = AccountStore.findByUserId(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: sub.status,
      planSlug: sub.plan.slug,
      planName: sub.plan.name,
      billingInterval: sub.billingInterval,
      accountCount: accounts.length,
      tradeCount: trades.length,
      createdAt: user.createdAt,
    };
  }

  /**
   * Retrieve platform audit trail logs
   */
  static getAuditLogs(): AuditLogEntry[] {
    return UserStore.getAuditLogs().sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}
