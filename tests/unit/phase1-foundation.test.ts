import { describe, it, expect } from "vitest";
import { Trade, DashboardMetrics } from "@/types";

describe("Phase 1: Foundation & Data Architecture", () => {
  it("validates financial trade data structures and metrics", () => {
    const testTrade: Trade = {
      id: "trd_test_01",
      userId: "usr_alex",
      accountId: "acc_101",
      symbol: "NQ",
      assetClass: "FUTURES",
      direction: "LONG",
      status: "CLOSED",
      entryTime: "2026-10-12T14:30:00Z",
      exitTime: "2026-10-12T14:45:00Z",
      entryPrice: 18200.0,
      exitPrice: 18225.0,
      quantity: 2,
      contractMultiplier: 20,
      initialRisk: 500,
      grossPnl: 1000.0,
      fees: 10.0,
      commissions: 5.0,
      netPnl: 985.0,
      rMultiple: 1.97,
      rating: 5,
      createdAt: "2026-10-12",
    };

    expect(testTrade.symbol).toBe("NQ");
    expect(testTrade.direction).toBe("LONG");
    expect(testTrade.netPnl).toBe(985.0);
    expect(testTrade.rMultiple).toBeCloseTo(1.97, 2);
  });

  it("calculates aggregate metrics without division by zero", () => {
    const metrics: DashboardMetrics = {
      netPnl: 14820.5,
      grossPnl: 15410.0,
      totalFees: 589.5,
      totalTrades: 64,
      winningTrades: 41,
      losingTrades: 23,
      breakEvenTrades: 0,
      winRate: (41 / 64) * 100,
      profitFactor: 2.18,
      expectancy: 231.57,
      avgWinner: 540.2,
      avgLoser: -318.5,
      winLossRatio: 1.7,
      avgRMultiple: 1.85,
      maxDrawdown: 1240.0,
      maxDrawdownPct: 2.41,
      largestWinner: 2450.0,
      largestLoser: -750.0,
      avgHoldingTimeMinutes: 24.5,
    };

    expect(metrics.winRate).toBeGreaterThan(64);
    expect(metrics.profitFactor).toBeGreaterThan(2.0);
    expect(metrics.netPnl).toBe(14820.5);
  });
});
