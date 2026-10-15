import { describe, it, expect, beforeEach } from "vitest";
import { TicketService } from "@/lib/support/ticket-service";
import { TicketStore } from "@/lib/support/ticket-store";
import { AdminService } from "@/lib/admin/admin-service";
import { BillingStore } from "@/lib/billing/billing-store";
import { UserStore } from "@/lib/auth/user-store";

describe("Phase 10: SaaS Administrator Dashboard & Support Ticketing Suite", () => {
  const USER_A = "usr_tester_ticket_a";
  const USER_B = "usr_tester_ticket_b";
  const ADMIN_USER = "usr_admin_specialist";

  beforeEach(() => {
    TicketStore.clear();
  });

  it("creates a support ticket with initial message thread", () => {
    const ticket = TicketService.createTicket(
      USER_A,
      "user_a@test.com",
      "Trader A",
      "BUG_REPORT",
      "HIGH",
      "Tradovate fill timestamp timezone discrepancy",
      "Fills imported from Tradovate have an unexpected 4-hour offset."
    );

    expect(ticket).toBeDefined();
    expect(ticket.id).toContain("tkt_");
    expect(ticket.userId).toBe(USER_A);
    expect(ticket.status).toBe("OPEN");
    expect(ticket.priority).toBe("HIGH");
    expect(ticket.category).toBe("BUG_REPORT");
    expect(ticket.messages.length).toBe(1);
    expect(ticket.messages[0].senderId).toBe(USER_A);
    expect(ticket.messages[0].message).toContain("Tradovate");
  });

  it("filters tickets by userId, status, and category", () => {
    TicketService.createTicket(
      USER_A,
      "a@test.com",
      "A",
      "BILLING",
      "LOW",
      "Billing receipt",
      "Where can I find PDF receipts?"
    );

    TicketService.createTicket(
      USER_B,
      "b@test.com",
      "B",
      "FEATURE_REQUEST",
      "MEDIUM",
      "Custom commission rules",
      "Can we add tiered commission structures?"
    );

    const allTickets = TicketService.getTickets();
    expect(allTickets.length).toBe(2);

    const userATickets = TicketService.getTickets({ userId: USER_A });
    expect(userATickets.length).toBe(1);
    expect(userATickets[0].category).toBe("BILLING");

    const billingTickets = TicketService.getTickets({ category: "BILLING" });
    expect(billingTickets.length).toBe(1);
  });

  it("enforces tenant isolation and admin view privileges on ticket details", () => {
    const ticket = TicketService.createTicket(
      USER_A,
      "a@test.com",
      "A",
      "GENERAL",
      "LOW",
      "Question",
      "Test message"
    );

    // Author can access
    const authorView = TicketService.getTicketById(ticket.id, USER_A, false);
    expect(authorView.id).toBe(ticket.id);

    // Admin can access
    const adminView = TicketService.getTicketById(ticket.id, ADMIN_USER, true);
    expect(adminView.id).toBe(ticket.id);

    // Foreign user is rejected
    expect(() => {
      TicketService.getTicketById(ticket.id, USER_B, false);
    }).toThrow("Access denied");
  });

  it("adds reply messages and auto-transitions status to IN_PROGRESS upon admin reply", () => {
    const ticket = TicketService.createTicket(
      USER_A,
      "a@test.com",
      "A",
      "BUG_REPORT",
      "MEDIUM",
      "Chart scaling bug",
      "Candlestick chart bars are squished."
    );
    expect(ticket.status).toBe("OPEN");

    const updated = TicketService.addMessage(
      ticket.id,
      ADMIN_USER,
      "ADMIN",
      "Support Lead",
      "We've reproduced the issue and pushed a patch to resolve it."
    );

    expect(updated.messages.length).toBe(2);
    expect(updated.status).toBe("IN_PROGRESS");
    expect(updated.messages[1].senderRole).toBe("ADMIN");
  });

  it("updates ticket status to RESOLVED and CLOSED", () => {
    const ticket = TicketService.createTicket(
      USER_A,
      "a@test.com",
      "A",
      "GENERAL",
      "LOW",
      "Account setup",
      "All good now."
    );

    const resolved = TicketService.updateStatus(ticket.id, "RESOLVED", ADMIN_USER);
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.assignedAdminId).toBe(ADMIN_USER);

    const closed = TicketService.updateStatus(ticket.id, "CLOSED");
    expect(closed.status).toBe("CLOSED");
  });

  it("calculates SaaS Admin platform KPIs accurately", () => {
    const stats = AdminService.getAdminStats();

    expect(stats).toBeDefined();
    expect(typeof stats.mrr).toBe("number");
    expect(typeof stats.activeSubscribers).toBe("number");
    expect(typeof stats.totalTradesLogged).toBe("number");
    expect(typeof stats.churnRate).toBe("number");
  });

  it("allows admin to retrieve users and override subscription tiers", () => {
    // Register test user
    const testAdminUser = "usr_tester_admin_override";
    UserStore.create({
      id: testAdminUser,
      email: "override@test.com",
      name: "Override Tester",
      passwordHash: "hash123",
      role: "USER",
      baseCurrency: "USD",
      timezone: "America/New_York",
      emailVerified: true,
      twoFactorEnabled: false,
      isSuspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const userView = AdminService.updateUserTier(testAdminUser, "elite");
    expect(userView).toBeDefined();
    expect(userView?.planSlug).toBe("elite");
    expect(userView?.planName).toBe("Elite Institutional");

    const sub = BillingStore.getSubscription(testAdminUser);
    expect(sub?.plan.slug).toBe("elite");
  });
});
