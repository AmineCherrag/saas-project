import { describe, it, expect, beforeEach } from "vitest";
import { AnalyticsService } from "@/lib/analytics/analytics-service";
import { TradeService } from "@/lib/trades/trade-service";
import { AccountService } from "@/lib/accounts/account-service";
import { UserStore } from "@/lib/auth/user-store";

describe("Phase 6: Executive Dashboard & Interactive Performance Calendar", () => {
  let userAId: string;
  let userBId: string;
  let accountA1Id: string;
  let accountA2Id: string;
  let accountBId: string;

  beforeEach(() => {
    // Create User A
    const idA = `usr_p6_a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userA = UserStore.create({
      id: idA,
      email: `${idA}@tradepulse.io`,
      passwordHash: "hash",
      name: "Dashboard User A",
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

    // Create User B
    const idB = `usr_p6_b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userB = UserStore.create({
      id: idB,
      email: `${idB}@tradepulse.io`,
      passwordHash: "hash",
      name: "Dashboard User B",
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

  describe("Executive Dashboard Analytics Calculation", () => {
    it("returns zero metrics safely when no closed trades exist", () => {
      const analytics = AnalyticsService.getDashboardAnalytics(userAId);
      expect(analytics.metrics.totalTrades).toBe(0);
      expect(analytics.metrics.netPnl).toBe(0);
      expect(analytics.metrics.winRate).toBe(0);
      expect(analytics.metrics.profitFactor).toBe(0);
      expect(analytics.metrics.expectancy).toBe(0);
      expect(analytics.metrics.maxDrawdown).toBe(0);
      expect(analytics.equityCurve.length).toBe(0);
    });

    it("accurately computes metrics across a sequence of winning and losing trades", () => {
      // Trade 1: +$1,000 net ($1,020 gross, $20 fees), 2 R
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-10T10:00:00Z",
        exitTime: "2026-10-10T11:00:00Z",
        entryPrice: 5800.0,
        exitPrice: 5810.2, // 10.2 pts * $50 = $510 * 2 contracts = $1020 gross
        quantity: 2,
        fees: 20.0,
        commissions: 0.0,
        stopLoss: 5795.0, // Risk = 5 pts * $50 * 2 = $500 -> R = ~2.0
      });

      // Trade 2: -$400 net (-$380 gross, $20 fees)
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "NQ",
        assetClass: "FUTURES",
        direction: "SHORT",
        status: "CLOSED",
        entryTime: "2026-10-11T13:00:00Z",
        exitTime: "2026-10-11T14:00:00Z",
        entryPrice: 20500.0,
        exitPrice: 20519.0, // Loss: 19 pts * $20 = $380 loss + $20 fees = -$400
        quantity: 1,
        fees: 20.0,
        commissions: 0.0,
      });

      // Trade 3: +$600 net ($610 gross, $10 fees)
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-12T09:30:00Z",
        exitTime: "2026-10-12T10:30:00Z",
        entryPrice: 5810.0,
        exitPrice: 5816.1, // 6.1 pts * $50 = $305 * 2 = $610 gross - $10 fees = $600 net
        quantity: 2,
        fees: 10.0,
        commissions: 0.0,
      });

      const analytics = AnalyticsService.getDashboardAnalytics(userAId);
      const m = analytics.metrics;

      // Net P&L: 1000 - 400 + 600 = +$1,200
      expect(m.netPnl).toBe(1200);
      expect(m.totalTrades).toBe(3);
      expect(m.winningTrades).toBe(2);
      expect(m.losingTrades).toBe(1);

      // Win Rate: 2 / 3 = 66.7%
      expect(m.winRate).toBe(66.7);

      // Profit Factor: Total Gross Wins ($1,600) / Total Gross Losses ($400) = 4.0
      expect(m.profitFactor).toBe(4.0);

      // Expectancy: $1,200 / 3 = $400 / trade
      expect(m.expectancy).toBe(400);

      // Largest Winner: $1,000, Largest Loser: -$400
      expect(m.largestWinner).toBe(1000);
      expect(m.largestLoser).toBe(-400);

      // Max Drawdown tracking: Peak was $1,000 after trade 1, then dropped by $400 after trade 2
      expect(m.maxDrawdown).toBe(400);
      expect(m.maxDrawdownPct).toBe(40); // 400 / 1000 = 40%

      // Equity Curve verification
      expect(analytics.equityCurve.length).toBe(3);
      expect(analytics.equityCurve[0].cumulativePnl).toBe(1000);
      expect(analytics.equityCurve[1].cumulativePnl).toBe(600);
      expect(analytics.equityCurve[2].cumulativePnl).toBe(1200);
      expect(analytics.equityCurve[1].drawdown).toBe(400);
    });

    it("filters analytics by specific account", () => {
      // Trade on Account A1
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-10T10:00:00Z",
        entryPrice: 5800.0,
        exitPrice: 5810.0,
        quantity: 1,
      });

      // Trade on Account A2
      TradeService.createTrade(userAId, {
        accountId: accountA2Id,
        symbol: "AAPL",
        assetClass: "STOCKS",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-11T14:00:00Z",
        entryPrice: 220.0,
        exitPrice: 225.0,
        quantity: 10,
      });

      // Filter by Account A1 only
      const a1Analytics = AnalyticsService.getDashboardAnalytics(userAId, { accountId: accountA1Id });
      expect(a1Analytics.metrics.totalTrades).toBe(1);
      expect(a1Analytics.recentTrades[0].symbol).toBe("ES");

      // Filter by Account A2 only
      const a2Analytics = AnalyticsService.getDashboardAnalytics(userAId, { accountId: accountA2Id });
      expect(a2Analytics.metrics.totalTrades).toBe(1);
      expect(a2Analytics.recentTrades[0].symbol).toBe("AAPL");
    });

    it("enforces tenant isolation: User B's dashboard does not include User A's trades", () => {
      // Trade for User A
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-10T10:00:00Z",
        entryPrice: 5800.0,
        exitPrice: 5820.0,
        quantity: 1,
      });

      // Trade for User B
      TradeService.createTrade(userBId, {
        accountId: accountBId,
        symbol: "MSFT",
        assetClass: "STOCKS",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-10T10:00:00Z",
        entryPrice: 420.0,
        exitPrice: 425.0,
        quantity: 5,
      });

      const userAAnalytics = AnalyticsService.getDashboardAnalytics(userAId);
      const userBAnalytics = AnalyticsService.getDashboardAnalytics(userBId);

      expect(userAAnalytics.metrics.totalTrades).toBe(1);
      expect(userAAnalytics.recentTrades[0].symbol).toBe("ES");

      expect(userBAnalytics.metrics.totalTrades).toBe(1);
      expect(userBAnalytics.recentTrades[0].symbol).toBe("MSFT");
    });
  });

  describe("Interactive Performance Calendar Analytics", () => {
    it("groups trades by day and calculates monthly green/red day consistency", () => {
      // Day 1 (Oct 10): 2 trades, +$500 net (Green Day)
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-10T09:30:00Z",
        entryPrice: 5800.0,
        exitPrice: 5810.0,
        quantity: 1, // +$500
      });

      // Day 2 (Oct 12): 1 trade, -$200 net (Red Day)
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "NQ",
        assetClass: "FUTURES",
        direction: "SHORT",
        status: "CLOSED",
        entryTime: "2026-10-12T14:00:00Z",
        entryPrice: 20500.0,
        exitPrice: 20510.0,
        quantity: 1, // -$200
      });

      // Day 3 (Oct 15): 1 trade, +$800 net (Green Day)
      TradeService.createTrade(userAId, {
        accountId: accountA1Id,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-15T11:00:00Z",
        entryPrice: 5820.0,
        exitPrice: 5836.0,
        quantity: 1, // +$800
      });

      const cal = AnalyticsService.getCalendarAnalytics(userAId, "2026-10");

      expect(cal.yearMonth).toBe("2026-10");
      expect(cal.monthName).toBe("October 2026");
      expect(cal.days.length).toBe(31); // October has 31 days

      // Day 10 stats
      const day10 = cal.days.find((d) => d.dayNumber === 10);
      expect(day10).toBeDefined();
      expect(day10?.netPnl).toBe(500);
      expect(day10?.tradeCount).toBe(1);

      // Day 12 stats
      const day12 = cal.days.find((d) => d.dayNumber === 12);
      expect(day12).toBeDefined();
      expect(day12?.netPnl).toBe(-200);
      expect(day12?.tradeCount).toBe(1);

      // Day 15 stats
      const day15 = cal.days.find((d) => d.dayNumber === 15);
      expect(day15).toBeDefined();
      expect(day15?.netPnl).toBe(800);

      // Monthly Rollup
      expect(cal.monthSummary.netPnl).toBe(1100); // 500 - 200 + 800 = 1100
      expect(cal.monthSummary.tradingDays).toBe(3);
      expect(cal.monthSummary.greenDays).toBe(2);
      expect(cal.monthSummary.redDays).toBe(1);
      expect(cal.monthSummary.dayWinRate).toBe(66.7); // 2 / 3 = 66.7%

      // Best and Worst day
      expect(cal.monthSummary.bestDay?.netPnl).toBe(800);
      expect(cal.monthSummary.worstDay?.netPnl).toBe(-200);

      // Weekly summaries exist
      expect(cal.weeklySummaries.length).toBeGreaterThan(0);
    });
  });
});
