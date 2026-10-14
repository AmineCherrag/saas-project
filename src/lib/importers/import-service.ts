import Papa from "papaparse";
import { ImportBatch, ImportPreviewResult, ImportPreviewRow, Trade, TradeDirection, AssetClass } from "@/types";
import { BROKER_PRESETS, ColumnMapping, detectBrokerPreset, normalizeDirection, normalizeTimestamp } from "./broker-adapters";
import { ImportStore, FingerprintRecord } from "./import-store";
import { TradeService } from "../trades/trade-service";
import { AccountService } from "../accounts/account-service";
import { UserStore } from "../auth/user-store";
import { generateFingerprint } from "../auth/crypto";
import { calculateTradeMetrics, getContractMultiplier } from "../trade-engine/calculations";

export function parseCleanNumber(val: unknown, fallback: number = 0): number {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  const str = String(val).trim().replace(/[$,\s]/g, "");
  // Handle accounting parentheses (e.g., "(2.50)" -> 2.50)
  if (str.startsWith("(") && str.endsWith(")")) {
    const num = parseFloat(str.slice(1, -1));
    return isNaN(num) ? fallback : num;
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

export function detectAssetClass(symbol: string, accountAssetClass?: AssetClass): AssetClass {
  const upper = symbol.trim().toUpperCase();
  if (upper.includes("/") || upper.includes("USD") || upper.includes("EUR") || upper.includes("GBP")) {
    if (upper.length === 6 || upper.includes("/")) return "FOREX";
  }

  if (
    upper.startsWith("/ES") ||
    upper.startsWith("ES") ||
    upper.startsWith("NQ") ||
    upper.startsWith("YM") ||
    upper.startsWith("RTY") ||
    upper.startsWith("CL") ||
    upper.startsWith("GC") ||
    upper.startsWith("MES") ||
    upper.startsWith("MNQ") ||
    upper.match(/^[A-Z]{2}[FGHJKMNQUVXZ]\d{1,2}$/)
  ) {
    return "FUTURES";
  }
  if (["BTC", "ETH", "SOL", "USDT", "BTCUSD", "ETHUSD"].includes(upper)) {
    return "CRYPTO";
  }
  if (accountAssetClass) return accountAssetClass;
  return "STOCKS";
}

export class ImportService {
  /**
   * Parse CSV content and extract headers & records
   */
  static parseRawCSV(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
    const parsed = Papa.parse<Record<string, string>>(csvContent.trim(), {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    });

    const headers = parsed.meta.fields ? parsed.meta.fields.filter((h) => h.length > 0) : [];
    const rows = parsed.data.filter((row) => Object.values(row).some((val) => val && String(val).trim() !== ""));

    return { headers, rows };
  }

  /**
   * Resolve column mapping combining preset defaults and custom overrides
   */
  static resolveMapping(
    headers: string[],
    presetId?: string,
    customMapping?: Partial<ColumnMapping>
  ): { preset: string; mapping: ColumnMapping } {
    let resolvedPresetId = presetId && presetId !== "auto" && BROKER_PRESETS[presetId] ? presetId : detectBrokerPreset(headers);
    const preset = BROKER_PRESETS[resolvedPresetId] || BROKER_PRESETS.universal;

    const baseMapping: ColumnMapping = { ...preset.defaultMapping };

    // If custom overrides provided, apply them
    if (customMapping) {
      if (customMapping.symbolColumn) baseMapping.symbolColumn = customMapping.symbolColumn;
      if (customMapping.directionColumn) baseMapping.directionColumn = customMapping.directionColumn;
      if (customMapping.entryTimeColumn) baseMapping.entryTimeColumn = customMapping.entryTimeColumn;
      if (customMapping.exitTimeColumn) baseMapping.exitTimeColumn = customMapping.exitTimeColumn;
      if (customMapping.entryPriceColumn) baseMapping.entryPriceColumn = customMapping.entryPriceColumn;
      if (customMapping.exitPriceColumn) baseMapping.exitPriceColumn = customMapping.exitPriceColumn;
      if (customMapping.quantityColumn) baseMapping.quantityColumn = customMapping.quantityColumn;
      if (customMapping.feesColumn) baseMapping.feesColumn = customMapping.feesColumn;
      if (customMapping.commissionsColumn) baseMapping.commissionsColumn = customMapping.commissionsColumn;
      if (customMapping.contractMultiplierColumn) baseMapping.contractMultiplierColumn = customMapping.contractMultiplierColumn;
      if (customMapping.stopLossColumn) baseMapping.stopLossColumn = customMapping.stopLossColumn;
      if (customMapping.takeProfitColumn) baseMapping.takeProfitColumn = customMapping.takeProfitColumn;
      if (customMapping.notesColumn) baseMapping.notesColumn = customMapping.notesColumn;
    }

    return { preset: resolvedPresetId, mapping: baseMapping };
  }

  /**
   * Generate Preview of CSV Import with validation and duplicate checks
   */
  static previewImport(
    userId: string,
    accountId: string,
    fileName: string,
    csvContent: string,
    presetId?: string,
    customMapping?: Partial<ColumnMapping>
  ): ImportPreviewResult {
    const { headers, rows } = this.parseRawCSV(csvContent);
    const { preset, mapping } = this.resolveMapping(headers, presetId, customMapping);

    const existingFingerprints = ImportStore.getFingerprintsForUser(userId);
    const sessionFingerprints = new Set<string>();

    const sampleRows: ImportPreviewRow[] = [];
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 1;

      const rawSymbol = row[mapping.symbolColumn] || "";
      const rawDirection = row[mapping.directionColumn] || "BUY";
      const rawEntryTime = row[mapping.entryTimeColumn] || "";
      const rawExitTime = mapping.exitTimeColumn ? row[mapping.exitTimeColumn] : undefined;
      const rawEntryPrice = row[mapping.entryPriceColumn];
      const rawExitPrice = mapping.exitPriceColumn ? row[mapping.exitPriceColumn] : undefined;
      const rawQuantity = row[mapping.quantityColumn];
      const rawFees = mapping.feesColumn ? row[mapping.feesColumn] : undefined;
      const rawCommissions = mapping.commissionsColumn ? row[mapping.commissionsColumn] : undefined;

      const symbol = rawSymbol.trim().toUpperCase();
      const direction: TradeDirection = normalizeDirection(rawDirection);
      const entryTime = normalizeTimestamp(rawEntryTime);
      const exitTime = rawExitTime ? normalizeTimestamp(rawExitTime) : undefined;
      const entryPrice = parseCleanNumber(rawEntryPrice);
      const exitPrice = rawExitPrice ? parseCleanNumber(rawExitPrice) : undefined;
      const quantity = Math.abs(parseCleanNumber(rawQuantity));
      const fees = Math.abs(parseCleanNumber(rawFees));
      const commissions = Math.abs(parseCleanNumber(rawCommissions));

      let isValid = true;
      let validationError: string | undefined = undefined;

      if (!symbol) {
        isValid = false;
        validationError = "Missing or empty symbol";
      } else if (entryPrice <= 0) {
        isValid = false;
        validationError = "Entry price must be greater than 0";
      } else if (quantity <= 0) {
        isValid = false;
        validationError = "Quantity must be greater than 0";
      } else if (!entryTime || isNaN(new Date(entryTime).getTime())) {
        isValid = false;
        validationError = "Invalid entry timestamp";
      }

      // Compute execution fingerprint
      const fingerprintPayload = `${accountId}_${symbol}_${direction}_${entryTime}_${entryPrice}_${quantity}`;
      const fingerprint = generateFingerprint(fingerprintPayload);

      let isDuplicate = false;
      if (isValid) {
        if (existingFingerprints.has(fingerprint) || sessionFingerprints.has(fingerprint)) {
          isDuplicate = true;
          duplicateCount++;
        } else {
          sessionFingerprints.add(fingerprint);
          validCount++;
        }
      } else {
        invalidCount++;
      }

      // Compute estimated Net PnL if closed
      let netPnl: number | undefined = undefined;
      if (isValid && exitPrice && exitPrice > 0) {
        const metrics = calculateTradeMetrics({
          direction,
          entryPrice,
          exitPrice,
          quantity,
          contractMultiplier: 1,
          fees,
          commissions,
        });
        netPnl = metrics.netPnl;
      }

      sampleRows.push({
        rowIndex,
        symbol,
        direction,
        entryTime,
        exitTime,
        entryPrice,
        exitPrice,
        quantity,
        fees,
        commissions,
        netPnl,
        isValid,
        isDuplicate,
        validationError,
        fingerprint,
      });
    }

    return {
      fileName,
      brokerPreset: preset,
      totalRows: rows.length,
      validRows: validCount,
      duplicateRows: duplicateCount,
      invalidRows: invalidCount,
      detectedHeaders: headers,
      sampleRows,
    };
  }

  /**
   * Commit validated rows into TradePulse database
   */
  static executeImport(
    userId: string,
    accountId: string,
    fileName: string,
    csvContent: string,
    presetId?: string,
    customMapping?: Partial<ColumnMapping>,
    skipDuplicates: boolean = true
  ): {
    batch: ImportBatch;
    importedTrades: Trade[];
    summary: {
      totalRows: number;
      importedCount: number;
      duplicateCount: number;
      failedCount: number;
    };
  } {
    // Verify account ownership
    const account = AccountService.getAccountById(userId, accountId);

    const preview = this.previewImport(userId, accountId, fileName, csvContent, presetId, customMapping);
    const { headers, rows } = this.parseRawCSV(csvContent);
    const { preset, mapping } = this.resolveMapping(headers, presetId, customMapping);

    const batchId = `imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const importedTrades: Trade[] = [];
    const fingerprintRecords: FingerprintRecord[] = [];

    let importedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    for (const previewRow of preview.sampleRows) {
      if (!previewRow.isValid) {
        failedCount++;
        continue;
      }

      if (previewRow.isDuplicate && skipDuplicates) {
        duplicateCount++;
        continue;
      }

      try {
        const rawRow = rows[previewRow.rowIndex - 1];
        const rawMultiplier = mapping.contractMultiplierColumn ? rawRow[mapping.contractMultiplierColumn] : undefined;
        const rawStopLoss = mapping.stopLossColumn ? rawRow[mapping.stopLossColumn] : undefined;
        const rawTakeProfit = mapping.takeProfitColumn ? rawRow[mapping.takeProfitColumn] : undefined;
        const rawNotes = mapping.notesColumn ? rawRow[mapping.notesColumn] : undefined;

        const assetClass = detectAssetClass(previewRow.symbol, account.assetClass);
        const multiplier = parseCleanNumber(rawMultiplier, getContractMultiplier(assetClass, previewRow.symbol));
        const stopLoss = rawStopLoss ? parseCleanNumber(rawStopLoss) : undefined;
        const takeProfit = rawTakeProfit ? parseCleanNumber(rawTakeProfit) : undefined;

        const isClosed = previewRow.exitPrice !== undefined && previewRow.exitPrice > 0;

        const trade = TradeService.createTrade(userId, {
          accountId: account.id,
          symbol: previewRow.symbol,
          assetClass,
          direction: previewRow.direction,
          status: isClosed ? "CLOSED" : "OPEN",
          entryTime: previewRow.entryTime,
          exitTime: previewRow.exitTime,
          entryPrice: previewRow.entryPrice,
          exitPrice: previewRow.exitPrice,
          quantity: previewRow.quantity,
          contractMultiplier: multiplier,
          fees: previewRow.fees,
          commissions: previewRow.commissions,
          stopLoss: stopLoss && stopLoss > 0 ? stopLoss : undefined,
          takeProfit: takeProfit && takeProfit > 0 ? takeProfit : undefined,
          notes: rawNotes ? String(rawNotes).trim() : `Imported via ${preset.toUpperCase()} (${fileName})`,
          rating: 3,
        });

        importedTrades.push(trade);
        importedCount++;

        fingerprintRecords.push({
          fingerprint: previewRow.fingerprint,
          batchId,
          tradeId: trade.id,
          userId,
          createdAt: new Date().toISOString(),
        });
      } catch {
        failedCount++;
      }
    }

    const batch: ImportBatch = {
      id: batchId,
      userId,
      accountId,
      brokerPreset: preset,
      fileName,
      totalRows: preview.totalRows,
      importedCount,
      duplicateCount,
      failedCount,
      tradeIds: importedTrades.map((t) => t.id),
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    };

    ImportStore.createBatch(batch);
    if (fingerprintRecords.length > 0) {
      ImportStore.recordFingerprints(fingerprintRecords);
    }

    UserStore.logAudit({
      userId,
      action: "CSV_IMPORT_COMPLETED",
      details: {
        batchId,
        fileName,
        importedCount,
        duplicateCount,
        failedCount,
      },
    });

    return {
      batch,
      importedTrades,
      summary: {
        totalRows: preview.totalRows,
        importedCount,
        duplicateCount,
        failedCount,
      },
    };
  }

  /**
   * Revert (rollback) an entire import batch and restore account balance
   */
  static revertBatch(
    userId: string,
    batchId: string
  ): { success: boolean; revertedCount: number; batch: ImportBatch } {
    const batch = ImportStore.findById(batchId);
    if (!batch || batch.userId !== userId) {
      throw new Error("Import batch not found or access denied.");
    }

    if (batch.status === "REVERTED") {
      throw new Error("This import batch has already been reverted.");
    }

    let deletedCount = 0;
    for (const tradeId of batch.tradeIds) {
      try {
        const deleted = TradeService.deleteTrade(userId, tradeId);
        if (deleted) deletedCount++;
      } catch {
        // Continue deleting remaining trades if one was already removed
      }
    }

    ImportStore.removeFingerprintsForBatch(batchId);
    const updated = ImportStore.updateBatch(batchId, { status: "REVERTED" });

    UserStore.logAudit({
      userId,
      action: "CSV_IMPORT_REVERTED",
      details: { batchId, deletedCount },
    });

    return {
      success: true,
      revertedCount: deletedCount,
      batch: updated || batch,
    };
  }

  /**
   * Get user import history
   */
  static getImportHistory(userId: string): ImportBatch[] {
    return ImportStore.findByUserId(userId);
  }

  /**
   * Generate downloadable sample CSV template for a given broker
   */
  static generateTemplate(brokerId: string = "universal"): { fileName: string; content: string } {
    const key = brokerId.toLowerCase();

    switch (key) {
      case "tradovate":
        return {
          fileName: "tradovate_template.csv",
          content: [
            "Timestamp,Contract,B/S,Filled Qty,Avg Price,Commission,Status",
            "2026-10-10 09:30:15,ESZ4,Buy,2,5812.50,2.15,Filled",
            "2026-10-10 10:15:42,ESZ4,Sell,2,5832.75,2.15,Filled",
            "2026-10-11 13:45:00,NQZ4,Sell,1,20500.25,2.15,Filled",
          ].join("\n"),
        };

      case "thinkorswim":
        return {
          fileName: "thinkorswim_template.csv",
          content: [
            "Exec Time,Spread,Side,Qty,Pos Effect,Symbol,Exp,Strike,Type,Price,Net Price,Order Type",
            "10/10/26 09:35:12,STOCK,BUY,100,TO OPEN,NVDA,,,STOCK,120.50,120.50,LIMIT",
            "10/10/26 11:20:05,STOCK,SELL,100,TO CLOSE,NVDA,,,STOCK,125.75,125.75,LIMIT",
            "10/11/26 14:15:30,STOCK,BUY,50,TO OPEN,TSLA,,,STOCK,245.00,245.00,LIMIT",
          ].join("\n"),
        };

      case "ninjatrader":
        return {
          fileName: "ninjatrader_template.csv",
          content: [
            "Time,Instrument,Action,Qty,Price,Commission,Account",
            "10/10/2026 09:31:00,ES 12-26,Buy,1,5820.00,2.05,Sim101",
            "10/10/2026 09:55:00,ES 12-26,Sell,1,5835.50,2.05,Sim101",
            "10/11/2026 10:10:00,NQ 12-26,Sell,2,20480.00,4.10,Sim101",
          ].join("\n"),
        };

      case "metatrader":
        return {
          fileName: "metatrader_template.csv",
          content: [
            "Open Time,Type,Volume,Symbol,Open Price,S / L,T / P,Close Time,Close Price,Commission,Swap,Profit",
            "2026.10.10 08:30:00,buy,1.00,EURUSD,1.08500,1.08200,1.09200,2026.10.10 11:45:00,1.08950,5.00,0.00,450.00",
            "2026.10.11 09:15:00,sell,0.50,GBPUSD,1.30500,1.30800,1.29800,2026.10.11 12:20:00,1.30100,2.50,0.00,200.00",
          ].join("\n"),
        };

      case "interactivebrokers":
        return {
          fileName: "interactive_brokers_template.csv",
          content: [
            "DateTime,Symbol,Buy/Sell,Quantity,TradePrice,IBCommission,Multiplier,AssetClass",
            "2026-10-10 14:30:00,SPY,BUY,100,575.25,1.00,1,STK",
            "2026-10-10 15:45:00,SPY,SELL,100,578.50,1.00,1,STK",
            "2026-10-11 10:00:00,QQQ,BUY,50,490.10,1.00,1,STK",
          ].join("\n"),
        };

      case "universal":
      default:
        return {
          fileName: "tradepulse_universal_template.csv",
          content: [
            "Symbol,Direction,Entry Time,Exit Time,Entry Price,Exit Price,Quantity,Fees,Commissions,Multiplier,Stop Loss,Take Profit,Notes",
            "ES,LONG,2026-10-10 09:35:00,2026-10-10 10:15:00,5800.25,5820.50,2,2.50,4.00,50,5790.00,5830.00,Morning opening range breakout",
            "NQ,SHORT,2026-10-11 14:00:00,2026-10-11 14:45:00,20450.00,20400.00,1,1.50,2.50,20,20480.00,20350.00,VWAP rejection",
            "AAPL,LONG,2026-10-12 10:00:00,2026-10-12 11:30:00,225.50,230.00,50,0.00,0.00,1,223.00,235.00,Tech rally continuation",
          ].join("\n"),
        };
    }
  }
}
