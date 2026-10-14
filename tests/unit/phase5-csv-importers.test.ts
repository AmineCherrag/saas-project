import { describe, it, expect, beforeEach } from "vitest";
import { ImportService } from "@/lib/importers/import-service";
import { ImportStore } from "@/lib/importers/import-store";
import {
  detectBrokerPreset,
  normalizeDirection,
  normalizeTimestamp,
  BROKER_PRESETS,
} from "@/lib/importers/broker-adapters";
import { UserStore } from "@/lib/auth/user-store";
import { AccountService } from "@/lib/accounts/account-service";
import { TradeStore } from "@/lib/trades/trade-store";

describe("Phase 5: CSV Import Engine & Broker Format Adapters", () => {
  let testUserId: string;
  let testAccountId: string;

  beforeEach(() => {
    // Reset stores
    ImportStore.clear();

    const id = `usr_imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const testEmail = `importer_test_${id}@tradepulse.io`;
    const user = UserStore.create({
      id,
      email: testEmail,
      passwordHash: "hashed_pwd",
      name: "Importer Test User",
      role: "USER",
      baseCurrency: "USD",
      timezone: "America/New_York",
      emailVerified: true,
      createdAt: new Date().toISOString(),
    });
    testUserId = user.id;

    // Create a funded futures trading account
    const account = AccountService.createAccount(testUserId, {
      name: "Apex Trader Funding 50k",
      brokerName: "Tradovate",
      accountType: "PROP_FUNDED",
      assetClass: "FUTURES",
      initialBalance: 50000,
      currency: "USD",
    });
    testAccountId = account.id;
  });

  describe("Broker Format Detection & Normalization", () => {
    it("accurately detects broker presets from headers", () => {
      expect(detectBrokerPreset(["Timestamp", "Contract", "B/S", "Filled Qty", "Avg Price"])).toBe("tradovate");
      expect(detectBrokerPreset(["Exec Time", "Side", "Qty", "Pos Effect", "Symbol"])).toBe("thinkorswim");
      expect(detectBrokerPreset(["Time", "Instrument", "Action", "Qty", "Price"])).toBe("ninjatrader");
      expect(detectBrokerPreset(["Open Time", "Type", "Volume", "Symbol", "Close Time"])).toBe("metatrader");
      expect(detectBrokerPreset(["DateTime", "Symbol", "Buy/Sell", "Quantity", "TradePrice"])).toBe("interactivebrokers");
      expect(detectBrokerPreset(["SomeCustomHeader", "AnotherColumn"])).toBe("universal");
    });

    it("normalizes direction variants across broker notations", () => {
      expect(normalizeDirection("BUY")).toBe("LONG");
      expect(normalizeDirection("Bot")).toBe("LONG");
      expect(normalizeDirection("b")).toBe("LONG");
      expect(normalizeDirection("Long")).toBe("LONG");
      expect(normalizeDirection("1")).toBe("LONG");

      expect(normalizeDirection("SELL")).toBe("SHORT");
      expect(normalizeDirection("Sld")).toBe("SHORT");
      expect(normalizeDirection("s")).toBe("SHORT");
      expect(normalizeDirection("Short")).toBe("SHORT");
      expect(normalizeDirection("-1")).toBe("SHORT");
    });

    it("normalizes diverse date and timestamp formats", () => {
      const iso = "2026-10-12T14:30:00.000Z";
      expect(new Date(normalizeTimestamp(iso)).getTime()).toBe(new Date(iso).getTime());

      // MM/DD/YYYY HH:MM:SS
      const usDate = "10/12/2026 14:30:00";
      const normalizedUs = normalizeTimestamp(usDate);
      expect(isNaN(new Date(normalizedUs).getTime())).toBe(false);
    });
  });

  describe("Tradovate CSV Ingestion", () => {
    const tradovateCsv = `Timestamp,Contract,B/S,Filled Qty,Avg Price,Commission,Status
2026-10-10 09:30:15,ESZ4,Buy,2,5812.50,2.15,Filled
2026-10-10 10:15:42,ESZ4,Sell,2,5832.75,2.15,Filled
2026-10-11 13:45:00,NQZ4,Sell,1,20500.25,2.15,Filled`;

    it("previews Tradovate executions and flags zero errors", () => {
      const preview = ImportService.previewImport(
        testUserId,
        testAccountId,
        "tradovate_export.csv",
        tradovateCsv,
        "tradovate"
      );

      expect(preview.brokerPreset).toBe("tradovate");
      expect(preview.totalRows).toBe(3);
      expect(preview.validRows).toBe(3);
      expect(preview.duplicateRows).toBe(0);
      expect(preview.invalidRows).toBe(0);
      expect(preview.sampleRows[0].symbol).toBe("ESZ4");
      expect(preview.sampleRows[0].direction).toBe("LONG");
      expect(preview.sampleRows[0].entryPrice).toBe(5812.5);
      expect(preview.sampleRows[0].quantity).toBe(2);
      expect(preview.sampleRows[0].fees).toBe(2.15);
    });

    it("commits Tradovate trades into the user trade store", () => {
      const result = ImportService.executeImport(
        testUserId,
        testAccountId,
        "tradovate_export.csv",
        tradovateCsv,
        "tradovate"
      );

      expect(result.summary.importedCount).toBe(3);
      expect(result.summary.duplicateCount).toBe(0);
      expect(result.importedTrades.length).toBe(3);

      const trades = TradeStore.findByUserId(testUserId);
      expect(trades.length).toBe(3);

      // Verify contract multiplier applied for ES
      const esTrade = trades.find((t) => t.symbol === "ESZ4");
      expect(esTrade).toBeDefined();
      expect(esTrade?.contractMultiplier).toBe(50);
    });
  });

  describe("MetaTrader 4/5 Closed Trades CSV Ingestion", () => {
    const metatraderCsv = `Open Time,Type,Volume,Symbol,Open Price,S / L,T / P,Close Time,Close Price,Commission,Swap,Profit
2026.10.10 08:30:00,buy,1.00,EURUSD,1.08500,1.08200,1.09200,2026.10.10 11:45:00,1.08950,5.00,0.00,450.00
2026.10.11 09:15:00,sell,0.50,GBPUSD,1.30500,1.30800,1.29800,2026.10.11 12:20:00,1.30100,2.50,0.00,200.00`;

    it("parses closed positions with accurate net P&L calculation", () => {
      const result = ImportService.executeImport(
        testUserId,
        testAccountId,
        "mt5_statement.csv",
        metatraderCsv,
        "metatrader"
      );

      expect(result.summary.importedCount).toBe(2);
      expect(result.importedTrades.length).toBe(2);

      const trade1 = result.importedTrades[0];
      expect(trade1.symbol).toBe("EURUSD");
      expect(trade1.direction).toBe("LONG");
      expect(trade1.status).toBe("CLOSED");
      expect(trade1.entryPrice).toBe(1.085);
      expect(trade1.exitPrice).toBe(1.0895);
      expect(trade1.fees).toBe(5.0);
      expect(trade1.netPnl).toBeGreaterThan(0);
    });
  });

  describe("Universal Format and Validation Handling", () => {
    const universalCsv = `Symbol,Direction,Entry Time,Exit Time,Entry Price,Exit Price,Quantity,Fees,Commissions,Multiplier,Stop Loss,Take Profit,Notes
ES,LONG,2026-10-10 09:35:00,2026-10-10 10:15:00,5800.25,5820.50,2,2.50,4.00,50,5790.00,5830.00,Breakout
NQ,SHORT,2026-10-11 14:00:00,2026-10-11 14:45:00,20450.00,20400.00,1,1.50,2.50,20,20480.00,20350.00,VWAP rejection
BAD,,2026-10-12 10:00:00,,0,,0,0,0,1,,,Missing price and quantity`;

    it("identifies malformed records in preview without crashing", () => {
      const preview = ImportService.previewImport(
        testUserId,
        testAccountId,
        "test_universal.csv",
        universalCsv,
        "universal"
      );

      expect(preview.totalRows).toBe(3);
      expect(preview.validRows).toBe(2);
      expect(preview.invalidRows).toBe(1);
      expect(preview.sampleRows[2].isValid).toBe(false);
      expect(preview.sampleRows[2].validationError).toBeDefined();
    });
  });

  describe("Deduplication & Execution Fingerprints", () => {
    const sampleCsv = `Symbol,Direction,Entry Time,Exit Time,Entry Price,Exit Price,Quantity,Fees,Commissions,Multiplier
ES,LONG,2026-10-10 09:35:00,2026-10-10 10:15:00,5800.25,5820.50,2,2.50,4.00,50`;

    it("prevents duplicate executions on re-importing the same CSV", () => {
      // First import
      const firstRun = ImportService.executeImport(
        testUserId,
        testAccountId,
        "es_trades.csv",
        sampleCsv,
        "universal"
      );
      expect(firstRun.summary.importedCount).toBe(1);
      expect(firstRun.summary.duplicateCount).toBe(0);

      // Second import with identical payload
      const secondRun = ImportService.executeImport(
        testUserId,
        testAccountId,
        "es_trades.csv",
        sampleCsv,
        "universal",
        undefined,
        true // skipDuplicates = true
      );
      expect(secondRun.summary.importedCount).toBe(0);
      expect(secondRun.summary.duplicateCount).toBe(1);

      // Verify only 1 trade exists in store
      const trades = TradeStore.findByUserId(testUserId);
      expect(trades.length).toBe(1);
    });
  });

  describe("Batch Rollback / Revert", () => {
    const sampleCsv = `Symbol,Direction,Entry Time,Exit Time,Entry Price,Exit Price,Quantity,Fees,Commissions,Multiplier
ES,LONG,2026-10-10 09:35:00,2026-10-10 10:15:00,5800.00,5810.00,1,0.00,0.00,50`;

    it("reverts batch, deletes all trades, and restores account balance", () => {
      const initialAccount = AccountService.getAccountById(testUserId, testAccountId);
      const startingBalance = initialAccount.currentBalance; // 50,000

      // Execute import: 1 trade with 10 pts profit * $50 = +$500 net P&L
      const importResult = ImportService.executeImport(
        testUserId,
        testAccountId,
        "batch_test.csv",
        sampleCsv,
        "universal"
      );

      const accountAfterImport = AccountService.getAccountById(testUserId, testAccountId);
      expect(accountAfterImport.currentBalance).toBe(startingBalance + 500); // 50,500

      // Now revert the batch
      const revertResult = ImportService.revertBatch(testUserId, importResult.batch.id);
      expect(revertResult.success).toBe(true);
      expect(revertResult.revertedCount).toBe(1);
      expect(revertResult.batch.status).toBe("REVERTED");

      // Verify trades were deleted
      const trades = TradeStore.findByUserId(testUserId);
      expect(trades.length).toBe(0);

      // Verify account balance was restored back to 50,000
      const accountAfterRevert = AccountService.getAccountById(testUserId, testAccountId);
      expect(accountAfterRevert.currentBalance).toBe(startingBalance);

      // Attempting to revert again should throw
      expect(() => {
        ImportService.revertBatch(testUserId, importResult.batch.id);
      }).toThrow("already been reverted");
    });
  });

  describe("Template Generation", () => {
    it("generates templates for all supported broker presets", () => {
      const presets = ["universal", "tradovate", "thinkorswim", "ninjatrader", "metatrader", "interactivebrokers"];

      for (const preset of presets) {
        const tmpl = ImportService.generateTemplate(preset);
        expect(tmpl.fileName).toContain(".csv");
        expect(tmpl.content.length).toBeGreaterThan(0);
        expect(tmpl.content.includes(",")).toBe(true);
      }
    });
  });
});
