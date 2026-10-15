import { describe, it, expect, beforeEach } from "vitest";
import { ReportingService, deduceMarketSession, deduceDurationBucket } from "@/lib/analytics/reporting-service";
import { TradeService } from "@/lib/trades/trade-service";
import { AccountService } from "@/lib/accounts/account-service";
import { UserStore } from "@/lib/auth/user-store";

describe("Phase 7: Advanced Analytics & Quantitative Reporting Engine", () => {
  let userAId: string;
  let userBId: string;
  let accountA1Id: string;
  let accountA2Id: string;
  let accountBId: string;

  beforeEach(() => {
    // User A
    const idA = `usr_p7_a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userA = UserStore.create({
      id: idA,
      email: `${idA}@tradepulse.io`,
      passwordHash: "hash",
      name: "Quant User A",
      role: "USER",
      baseCurrency: "USD",
      timezone: "America/New_York",
      emailVerified: true,
      twoFactorEnabled: false,
      isSuspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    userAId = userA.id;

    // User B
    const idB = `usr_p7_b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userB = UserStore.create({
      id: idB,
      email: `${idB}@tradepulse.io`,
      passwordHash: "hash",
      name: "Quant User B",
      role: "USER",
      baseCurrency: "USD",
      timezone: "America/New_York",
      emailVerified: true,
      twoFactorEnabled: false,
      isSuspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    userBId = userB.id;

    // Accounts for User A
    const accA1 = AccountService.createAccount(userAId, {
      name: "Apex 50k Futures",
      brokerName: "Tradovate",
      accountType: "PROP_FUNDED",
      assetClass: "FUTURES",
      initialBalance: 50000,
      currency: "USD",
    });
    accountA1Id = accA1.id;

    const accA2 = AccountService.createAccount(userAId, {
      name: "Schwab Equities",
      brokerName: "ThinkorSwim",
      accountType: "MARGIN",
      assetClass: "STOCKS",
      initialBalance: 25000,
      currency: "USD",
    });
    accountA2Id = accA2.id;

    // Account for User B
    const accB = AccountService.createAccount(userBId, {
      name: "User B Account",
      brokerName: "Interactive Brokers",
      accountType: "CASH",
      assetClass: "STOCKS",
      initialBalance: 10000,
      currency: "USD",
    });
    accountBId = accB.id;
  });

  describe("Helper Functions", () => {
    it("deduces market sessions from timestamps", () => {
      // 14:00 UTC = 09:30 EST (NY Open)
      expect(deduceMarketSession("2026-10-12T14:00:00Z")).toContain("NY Open");

      // 16:30 UTC = 12:00 EST (NY Midday)
      expect(deduceMarketSession("2026-10-12T16:30:00Z")).toContain("NY Midday");

      // 19:00 UTC = 14:30 EST (NY Power Hour)
      expect(deduceMarketSession("2026-10-12T19:00:00Z")).toContain("NY Power Hour");

      // Custom session overrides automatic calculation
      expect(deduceMarketSession("2026-10-12T19:00:00Z", "Custom Setup Session")).toBe("Custom Setup Session");
    });

    it("deduces holding duration buckets accurately", () => {
      // 3 minutes difference
      expect(deduceDurationBucket("2026-10-12T14:00:00Z", "2026-10-12T14:03:00Z")).toBe("Scalp (< 5m)");

      // 10 minutes difference
      expect(deduceDurationBucket("2026-10-12T14:00:00Z", "2026-10-12T14:10:00Z")).toBe("Momentum (5 - 15m)");

      // 30 minutes difference
      expect(deduceDurationBucket("2026-10-12T14:00:00Z", "2026-10-12T14:30:00Z")).toBe("Trend (15 - 60m)");

      // 2 hours difference
      expect(deduceDurationBucket("2026-10-12T14:00:00Z", "2026-10-12T16:00:00Z")).toBe("Session (1 - 4h)");

      // 6 hours difference
      expect(deduceDurationBucket("2026-10-12T14:00:00Z", "2026-10-12T20:00:00Z")).toBe("Swing (> 4h)");
    });
  });

  describe("Multi-Dimensional Quantitative Report", () => {
    beforeEach(() => {
      // Trade 1: ES Long, Monday 14:00 UTC (NY Open), Duration: 10m, +$500 net, Playbook: "ORB Breakout"
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-12T14:00:00Z", // Monday
        exitTime: "2026-10-12T14:10:00Z",
        entryPrice: 5800.0,
        exitPrice: 5810.0,
        quantity: 1,
        playbookName: "ORB Breakout",
      });

      // Trade 2: NQ Short, Monday 14:30 UTC (NY Open), Duration: 3m, -$300 net, Mistake: "FOMO"
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "NQ",
        assetClass: "FUTURES",
        direction: "SHORT",
        status: "CLOSED",
        entryTime: "2026-10-12T14:30:00Z", // Monday
        exitTime: "2026-10-12T14:33:00Z",
        entryPrice: 20500.0,
        exitPrice: 20515.0,
        quantity: 1, // 15 pts * 20 = $300 loss
        tags: [{ type: "MISTAKE", value: "FOMO" }],
      });

      // Trade 3: ES Long, Tuesday 16:00 UTC (NY Midday), Duration: 45m, +$1,000 net, Playbook: "ORB Breakout"
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-13T16:00:00Z", // Tuesday
        exitTime: "2026-10-13T16:45:00Z",
        entryPrice: 5810.0,
        exitPrice: 5830.0,
        quantity: 1, // 20 pts * 50 = $1000
        playbookName: "ORB Breakout",
      });

      // Trade 4: AAPL Long, Tuesday 16:30 UTC (NY Midday), Duration: 2h, -$150 net, Mistake: "Chased Entry"
      TradeService.createTrade(userAId, {
        accountId: accountA2Id,
        symbol: "AAPL",
        assetClass: "STOCKS",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-13T16:30:00Z", // Tuesday
        exitTime: "2026-10-13T18:30:00Z",
        entryPrice: 230.0,
        exitPrice: 215.0,
        quantity: 10, // -$150
        tags: [{ type: "MISTAKE", value: "Chased Entry" }],
      });
    });

    it("slices performance by Symbol & Instrument", () => {
      const report = ReportingService.getQuantitativeReport(userAId);
      const symbols = report.symbolDistribution;

      // 3 symbols: ES, NQ, AAPL
      expect(symbols.length).toBe(3);

      const es = symbols.find((s) => s.key === "ES");
      expect(es).toBeDefined();
      expect(es?.tradeCount).toBe(2);
      expect(es?.winRate).toBe(100);
      expect(es?.netPnl).toBe(1500); // 500 + 1000

      const nq = symbols.find((s) => s.key === "NQ");
      expect(nq).toBeDefined();
      expect(nq?.netPnl).toBe(-300);

      const aapl = symbols.find((s) => s.key === "AAPL");
      expect(aapl).toBeDefined();
      expect(aapl?.netPnl).toBe(-150);

      expect(report.summary.bestSymbol).toBe("ES");
    });

    it("slices performance by Playbook & Setup strategy", () => {
      const report = ReportingService.getQuantitativeReport(userAId);
      const playbooks = report.playbookDistribution;

      const orb = playbooks.find((p) => p.key === "ORB Breakout");
      expect(orb).toBeDefined();
      expect(orb?.tradeCount).toBe(2);
      expect(orb?.winRate).toBe(100);
      expect(orb?.netPnl).toBe(1500);

      expect(report.summary.bestPlaybook).toBe("ORB Breakout");
    });

    it("slices performance by Day of the Week", () => {
      const report = ReportingService.getQuantitativeReport(userAId);
      const days = report.dayOfWeekDistribution;

      // Monday (1): 2 trades, +$500 - $300 = +$200 net
      const monday = days.find((d) => d.key === "1");
      expect(monday).toBeDefined();
      expect(monday?.tradeCount).toBe(2);
      expect(monday?.netPnl).toBe(200);

      // Tuesday (2): 2 trades, +$1,000 - $150 = +$850 net
      const tuesday = days.find((d) => d.key === "2");
      expect(tuesday).toBeDefined();
      expect(tuesday?.tradeCount).toBe(2);
      expect(tuesday?.netPnl).toBe(850);

      expect(report.summary.bestDayOfWeek).toBe("Tuesday");
    });

    it("slices performance by Holding Duration", () => {
      const report = ReportingService.getQuantitativeReport(userAId);
      const durations = report.durationDistribution;

      // Trade 2: 3 mins -> Scalp (< 5m)
      const scalp = durations.find((d) => d.key.includes("Scalp"));
      expect(scalp).toBeDefined();
      expect(scalp?.tradeCount).toBe(1);
      expect(scalp?.netPnl).toBe(-300);

      // Trade 1: 10 mins -> Momentum (5 - 15m)
      const momentum = durations.find((d) => d.key.includes("Momentum"));
      expect(momentum).toBeDefined();
      expect(momentum?.tradeCount).toBe(1);
      expect(momentum?.netPnl).toBe(500);

      // Trade 3: 45 mins -> Trend (15 - 60m)
      const trend = durations.find((d) => d.key.includes("Trend"));
      expect(trend).toBeDefined();
      expect(trend?.tradeCount).toBe(1);
      expect(trend?.netPnl).toBe(1000);

      // Trade 4: 2 hours -> Session (1 - 4h)
      const session = durations.find((d) => d.key.includes("Session"));
      expect(session).toBeDefined();
      expect(session?.tradeCount).toBe(1);
      expect(session?.netPnl).toBe(-150);
    });

    it("calculates Mistake Cost Ledger and Discipline Leakage", () => {
      const report = ReportingService.getQuantitativeReport(userAId);
      const mistakes = report.mistakeCostLedger;

      // Two logged mistakes: FOMO (-$300) and Chased Entry (-$150)
      expect(mistakes.length).toBe(2);

      const fomo = mistakes.find((m) => m.tagValue === "FOMO");
      expect(fomo).toBeDefined();
      expect(fomo?.occurrenceCount).toBe(1);
      expect(fomo?.totalLossAttributed).toBe(300);

      const chased = mistakes.find((m) => m.tagValue === "Chased Entry");
      expect(chased).toBeDefined();
      expect(chased?.totalLossAttributed).toBe(150);

      // Total discipline leakage: $300 + $150 = $450
      expect(report.totalDisciplineCost).toBe(450);
    });

    it("enforces tenant isolation: User B's report has 0 trades from User A", () => {
      const reportA = ReportingService.getQuantitativeReport(userAId);
      const reportB = ReportingService.getQuantitativeReport(userBId);

      expect(reportA.summary.totalTrades).toBe(4);
      expect(reportB.summary.totalTrades).toBe(0);
      expect(reportB.totalDisciplineCost).toBe(0);
    });
  });
});
