import { describe, it, expect } from "vitest";
import {
  calculateTradeMetrics,
  calculateFromExecutions,
  getContractMultiplier,
} from "@/lib/trade-engine/calculations";
import { TradeService } from "@/lib/trades/trade-service";
import { AccountService } from "@/lib/accounts/account-service";

describe("Phase 4: Core Trade Calculation Engine & Management", () => {
  describe("Mathematical Formula Precision", () => {
    it("accurately calculates Long position with fees and R-multiple", () => {
      // Buy 100 shares AAPL @ 150.00, Sell @ 155.00 (+5.00/share)
      // Stop loss @ 147.50 (Risk = 2.50/share, Total Risk = $250.00)
      // Fees = $2.00, Commissions = $1.00 (Total costs = $3.00)
      const result = calculateTradeMetrics({
        direction: "LONG",
        entryPrice: 150.0,
        exitPrice: 155.0,
        quantity: 100,
        contractMultiplier: 1.0,
        stopLoss: 147.5,
        fees: 2.0,
        commissions: 1.0,
      });

      expect(result.grossPnl).toBe(500.0);
      expect(result.netPnl).toBe(497.0);
      expect(result.initialRisk).toBe(250.0);
      expect(result.rMultiple).toBe(1.99); // 497 / 250 = 1.988 -> 1.99
      expect(result.isProfitable).toBe(true);
      expect(result.isBreakEven).toBe(false);
    });

    it("accurately calculates Short position with profit", () => {
      // Short 100 shares TSLA @ 200.00, Buy to cover @ 190.00 (+10.00/share)
      // Stop loss @ 205.00 (Risk = 5.00/share, Total Risk = $500.00)
      // Fees = $2.50
      const result = calculateTradeMetrics({
        direction: "SHORT",
        entryPrice: 200.0,
        exitPrice: 190.0,
        quantity: 100,
        contractMultiplier: 1.0,
        stopLoss: 205.0,
        fees: 2.5,
      });

      expect(result.grossPnl).toBe(1000.0);
      expect(result.netPnl).toBe(997.5);
      expect(result.initialRisk).toBe(500.0);
      expect(result.rMultiple).toBe(2.0); // 997.5 / 500 = 1.995 -> 2.00
      expect(result.isProfitable).toBe(true);
    });

    it("accurately calculates losing Short position", () => {
      // Short 50 shares @ 100.00, Stopped out @ 105.00 (-5.00/share)
      const result = calculateTradeMetrics({
        direction: "SHORT",
        entryPrice: 100.0,
        exitPrice: 105.0,
        quantity: 50,
        contractMultiplier: 1.0,
        stopLoss: 105.0,
        fees: 1.5,
      });

      expect(result.grossPnl).toBe(-250.0);
      expect(result.netPnl).toBe(-251.5);
      expect(result.initialRisk).toBe(250.0);
      expect(result.rMultiple).toBe(-1.01);
      expect(result.isProfitable).toBe(false);
    });

    it("evaluates break-even trades safely", () => {
      // Entry 100.00, Exit 100.00, Fees $0
      const result = calculateTradeMetrics({
        direction: "LONG",
        entryPrice: 100.0,
        exitPrice: 100.0,
        quantity: 10,
        contractMultiplier: 1.0,
      });

      expect(result.grossPnl).toBe(0.0);
      expect(result.netPnl).toBe(0.0);
      expect(result.isBreakEven).toBe(true);
    });

    it("applies futures point multipliers (ES = $50, NQ = $20)", () => {
      // 2 ES contracts @ 5000.00, Exit @ 5010.00 (+10 points)
      // Multiplier = 50.00 -> 10 pts * 2 contracts * 50 = $1,000.00
      const esMultiplier = getContractMultiplier("FUTURES", "ES");
      expect(esMultiplier).toBe(50.0);

      const esResult = calculateTradeMetrics({
        direction: "LONG",
        entryPrice: 5000.0,
        exitPrice: 5010.0,
        quantity: 2,
        contractMultiplier: esMultiplier,
        fees: 8.5,
      });
      expect(esResult.grossPnl).toBe(1000.0);
      expect(esResult.netPnl).toBe(991.5);

      // 2 NQ contracts @ 18000.00, Exit @ 18050.00 (+50 points)
      // Multiplier = 20.00 -> 50 pts * 2 contracts * 20 = $2,000.00
      const nqMultiplier = getContractMultiplier("FUTURES", "NQ");
      expect(nqMultiplier).toBe(20.0);

      const nqResult = calculateTradeMetrics({
        direction: "LONG",
        entryPrice: 18000.0,
        exitPrice: 18050.0,
        quantity: 2,
        contractMultiplier: nqMultiplier,
      });
      expect(nqResult.grossPnl).toBe(2000.0);
    });

    it("applies equity option multiplier ($100 per contract)", () => {
      // Buy 3 Calls @ $2.50 ($250/contract), Sell @ $4.00 ($400/contract)
      // Gain = $1.50 * 3 * 100 = $450.00
      const optMultiplier = getContractMultiplier("OPTIONS", "SPY");
      expect(optMultiplier).toBe(100.0);

      const optResult = calculateTradeMetrics({
        direction: "LONG",
        entryPrice: 2.5,
        exitPrice: 4.0,
        quantity: 3,
        contractMultiplier: optMultiplier,
      });
      expect(optResult.grossPnl).toBe(450.0);
    });

    it("safely handles omitted stop loss without division-by-zero crashes", () => {
      const result = calculateTradeMetrics({
        direction: "LONG",
        entryPrice: 100.0,
        exitPrice: 110.0,
        quantity: 10,
        contractMultiplier: 1.0,
        stopLoss: undefined,
      });

      expect(result.initialRisk).toBeNull();
      expect(result.rMultiple).toBeNull();
      expect(result.netPnl).toBe(100.0);
    });
  });

  describe("Multi-Fill Execution Aggregation", () => {
    it("calculates weighted average entry and exit prices for scale-ins", () => {
      // Entry 1: 10 contracts @ 5000.00
      // Entry 2: 10 contracts @ 5020.00
      // Weighted average entry = 5010.00
      // Exit 1: 20 contracts @ 5040.00 (+30 pts)
      const executions = [
        {
          id: "fill_1",
          tradeId: "t1",
          executionType: "ENTRY" as const,
          orderAction: "BUY" as const,
          timestamp: "2026-10-12 10:00:00",
          price: 5000.0,
          quantity: 10,
          fees: 5.0,
        },
        {
          id: "fill_2",
          tradeId: "t1",
          executionType: "ENTRY" as const,
          orderAction: "BUY" as const,
          timestamp: "2026-10-12 10:05:00",
          price: 5020.0,
          quantity: 10,
          fees: 5.0,
        },
        {
          id: "fill_3",
          tradeId: "t1",
          executionType: "EXIT" as const,
          orderAction: "SELL" as const,
          timestamp: "2026-10-12 10:30:00",
          price: 5040.0,
          quantity: 20,
          fees: 10.0,
        },
      ];

      const positionParams = calculateFromExecutions("LONG", executions, 50.0);

      expect(positionParams.entryPrice).toBe(5010.0);
      expect(positionParams.exitPrice).toBe(5040.0);
      expect(positionParams.quantity).toBe(20);
      expect(positionParams.fees).toBe(20.0);

      const metrics = calculateTradeMetrics(positionParams);
      // 30 pts * 20 contracts * 50 = $30,000 gross - $20 fees = $29,980 net
      expect(metrics.grossPnl).toBe(30000.0);
      expect(metrics.netPnl).toBe(29980.0);
    });
  });

  describe("Trade Management Service & Tenant Scoping", () => {
    const userA = "usr_trader_alpha";
    const userB = "usr_trader_bravo";
    let accountAId = "";
    let tradeAId = "";

    it("creates trade, updates account balance, and isolates to user", () => {
      // 1. Create account for User A with $50,000
      const account = AccountService.createAccount(userA, {
        name: "Test Prop Account",
        brokerName: "Tradovate",
        accountType: "PROP_EVALUATION",
        assetClass: "FUTURES",
        initialBalance: 50000.0,
        currency: "USD",
      });
      accountAId = account.id;

      // 2. Create trade: +$1,000 Net P&L
      const trade = TradeService.createTrade(userA, {
        accountId: accountAId,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-12T14:00:00Z",
        exitTime: "2026-10-12T14:30:00Z",
        entryPrice: 5000.0,
        exitPrice: 5010.0,
        quantity: 2,
        contractMultiplier: 50.0,
        fees: 10.0,
      });

      expect(trade.id).toBeDefined();
      expect(trade.netPnl).toBe(990.0);
      tradeAId = trade.id;

      // 3. Verify account balance was credited
      const updatedAccount = AccountService.getAccountById(userA, accountAId);
      expect(updatedAccount.currentBalance).toBe(50990.0);
    });

    it("enforces tenant isolation: User B cannot view or delete User A's trade", () => {
      expect(() => {
        TradeService.getTradeById(userB, tradeAId);
      }).toThrow("Trade record not found or access denied");

      expect(() => {
        TradeService.deleteTrade(userB, tradeAId);
      }).toThrow("Trade record not found or access denied");
    });

    it("duplicates trade with new timestamp and OPEN status", () => {
      const duplicated = TradeService.duplicateTrade(userA, tradeAId);
      expect(duplicated.id).not.toBe(tradeAId);
      expect(duplicated.symbol).toBe("ES");
      expect(duplicated.status).toBe("OPEN");
      expect(duplicated.entryPrice).toBe(5000.0);
    });

    it("deletes trade and reverses balance contribution", () => {
      const isDeleted = TradeService.deleteTrade(userA, tradeAId);
      expect(isDeleted).toBe(true);

      // Account balance should be reversed back to $50,000
      const revertedAccount = AccountService.getAccountById(userA, accountAId);
      expect(revertedAccount.currentBalance).toBe(50000.0);
    });
  });
});
