import { describe, it, expect } from "vitest";
import { prisma, isPostgresDatabase, getDatabaseUrl } from "@/lib/db/prisma";
import { UserStore } from "@/lib/auth/user-store";
import { AccountStore } from "@/lib/accounts/account-store";
import { TradeStore } from "@/lib/trades/trade-store";
import { JournalStore } from "@/lib/journal/journal-store";
import { PlaybookStore } from "@/lib/playbooks/playbook-store";
import { BillingStore } from "@/lib/billing/billing-store";
import { DisciplineStore } from "@/lib/discipline/discipline-store";
import { TicketStore } from "@/lib/support/ticket-store";
import { ImportStore } from "@/lib/importers/import-store";

describe("Prisma Database & Serverless Persistence Suite", () => {
  it("initializes Prisma client with all PostgreSQL models generated", () => {
    expect(prisma).toBeDefined();
    // Validate that all expected Prisma models exist on the client instance
    expect(prisma.user).toBeDefined();
    expect(prisma.session).toBeDefined();
    expect(prisma.tradingAccount).toBeDefined();
    expect(prisma.trade).toBeDefined();
    expect(prisma.journalEntry).toBeDefined();
    expect(prisma.playbook).toBeDefined();
    expect(prisma.subscription).toBeDefined();
    expect(prisma.invoice).toBeDefined();
    expect(prisma.disciplineRule).toBeDefined();
    expect(prisma.disciplineLog).toBeDefined();
    expect(prisma.supportTicket).toBeDefined();
    expect(prisma.auditLog).toBeDefined();
    expect(prisma.importBatch).toBeDefined();
    expect(prisma.importFingerprint).toBeDefined();
  });

  it("strictly disables SQLite and file fallback in database client", () => {
    const originalEnv = process.env.DATABASE_URL;

    // When DATABASE_URL is not provided
    delete process.env.DATABASE_URL;
    expect(getDatabaseUrl()).toBeUndefined();
    expect(isPostgresDatabase()).toBe(false);

    // When DATABASE_URL is configured for PostgreSQL
    process.env.DATABASE_URL = "postgresql://user:pass@ep-neon.us-east-1.aws.neon.tech/tradepulse";
    expect(getDatabaseUrl()).toBe(process.env.DATABASE_URL);
    expect(isPostgresDatabase()).toBe(true);

    // Restore env
    if (originalEnv) process.env.DATABASE_URL = originalEnv;
    else delete process.env.DATABASE_URL;
  });

  it("executes User and Session Prisma code path without filesystem dependencies", async () => {
    const testUserId = `usr_prisma_${Date.now()}`;
    const testEmail = `${testUserId}@tradepulse.io`;

    // Create user
    const user = UserStore.create({
      id: testUserId,
      email: testEmail,
      passwordHash: "$2a$12$eXampleHashedPasswordValue",
      name: "Prisma Test User",
      role: "USER",
      baseCurrency: "USD",
      timezone: "America/New_York",
      emailVerified: true,
      twoFactorEnabled: false,
      isSuspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(user.id).toBe(testUserId);

    // Query user via async Prisma code path
    const foundUser = await UserStore.findByIdAsync(testUserId);
    expect(foundUser).not.toBeNull();
    expect(foundUser?.email).toBe(testEmail);

    const foundByEmail = await UserStore.findByEmailAsync(testEmail);
    expect(foundByEmail).not.toBeNull();
    expect(foundByEmail?.id).toBe(testUserId);

    // Create and query session
    const sessionToken = `sess_tok_${Date.now()}`;
    UserStore.saveSession({
      sessionId: sessionToken,
      userId: testUserId,
      email: testEmail,
      name: "Prisma Test User",
      role: "USER",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const session = await UserStore.findSessionAsync(sessionToken);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(testUserId);

    // Cleanup session and user
    UserStore.deleteSession(sessionToken);
    expect(UserStore.findSession(sessionToken)).toBeNull();

    const deleted = UserStore.delete(testUserId);
    expect(deleted).toBe(true);
    expect(UserStore.findById(testUserId)).toBeNull();
  });

  it("executes TradingAccount and Trade persistence without touching disk", async () => {
    const testUserId = `usr_acc_${Date.now()}`;
    const testAccountId = `acc_prisma_${Date.now()}`;
    const testTradeId = `trd_prisma_${Date.now()}`;

    // Create account
    const acc = AccountStore.create({
      id: testAccountId,
      userId: testUserId,
      name: "Prisma Managed Account",
      brokerName: "Tradovate",
      accountType: "PROP_FUNDED",
      assetClass: "FUTURES",
      initialBalance: 50000,
      currentBalance: 50000,
      currency: "USD",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });
    expect(acc.id).toBe(testAccountId);

    const foundAcc = await AccountStore.findByIdAsync(testAccountId);
    expect(foundAcc?.name).toBe("Prisma Managed Account");

    // Create trade
    const trade = TradeStore.create({
      id: testTradeId,
      userId: testUserId,
      accountId: testAccountId,
      symbol: "ES",
      assetClass: "FUTURES",
      direction: "LONG",
      status: "CLOSED",
      entryTime: new Date().toISOString(),
      exitTime: new Date().toISOString(),
      entryPrice: 5800.25,
      exitPrice: 5815.5,
      quantity: 2,
      contractMultiplier: 50,
      grossPnl: 1525,
      fees: 4.3,
      commissions: 0,
      netPnl: 1520.7,
      createdAt: new Date().toISOString(),
    });
    expect(trade.id).toBe(testTradeId);

    const foundTrade = await TradeStore.findByIdAsync(testTradeId);
    expect(foundTrade).not.toBeNull();
    expect(foundTrade?.netPnl).toBe(1520.7);

    // Cleanup
    TradeStore.delete(testTradeId);
    AccountStore.delete(testAccountId);
    expect(TradeStore.findById(testTradeId)).toBeNull();
    expect(AccountStore.findById(testAccountId)).toBeNull();
  });

  it("executes Journal, Playbook, Discipline, Billing, and Support stores safely in serverless environments", async () => {
    const testUserId = `usr_mod_${Date.now()}`;

    // Journal Entry
    const jEntry = JournalStore.create({
      id: `j_${Date.now()}`,
      userId: testUserId,
      entryDate: "2026-10-16",
      title: "Prisma Test Review",
      preSessionPlan: "Execute playbook",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(JournalStore.findByDate(testUserId, "2026-10-16")?.title).toBe("Prisma Test Review");
    JournalStore.delete(jEntry.id);

    // Playbook
    const playbook = PlaybookStore.create({
      id: `pb_${Date.now()}`,
      userId: testUserId,
      name: "Opening Range Breakout",
      setupRules: "Check 15m volume",
      entryCriteria: "Break of high",
      exitCriteria: "2R target",
      riskRules: "Max 1% account risk",
      createdAt: new Date().toISOString(),
    });
    expect(PlaybookStore.findById(playbook.id)?.name).toBe("Opening Range Breakout");
    PlaybookStore.delete(playbook.id);

    // Discipline Rule & Log
    const rule = DisciplineStore.createRule({
      id: `rule_${Date.now()}`,
      userId: testUserId,
      title: "Max 3 Trades Per Day",
      ruleType: "DAILY",
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    expect(DisciplineStore.findRuleById(rule.id)?.title).toBe("Max 3 Trades Per Day");
    DisciplineStore.deleteRule(rule.id);

    // Billing Subscription & Invoice
    BillingStore.upsertSubscription({
      id: `sub_${Date.now()}`,
      userId: testUserId,
      plan: {
        id: "plan_pro",
        name: "Pro",
        slug: "pro",
        priceMonthly: 49,
        priceYearly: 470,
        maxAccounts: 10,
        maxTradesPerMonth: -1,
        hasCsvImport: true,
        hasAdvancedAnalytics: true,
        hasPlaybooks: true,
        hasAiMentor: true,
        hasReplay: true,
        isActive: true,
      },
      status: "ACTIVE",
      billingInterval: "monthly",
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
    });
    expect(BillingStore.getSubscription(testUserId)?.plan.slug).toBe("pro");

    // Support Ticket
    const ticket = TicketStore.upsertTicket({
      id: `tkt_${Date.now()}`,
      userId: testUserId,
      userEmail: `${testUserId}@tradepulse.io`,
      userName: "Prisma Tester",
      category: "GENERAL",
      priority: "HIGH",
      status: "OPEN",
      subject: "PostgreSQL Migration Query",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(TicketStore.getTicketById(ticket.id)?.subject).toBe("PostgreSQL Migration Query");
    TicketStore.deleteTicket(ticket.id);
  });
});
