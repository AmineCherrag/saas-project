import Decimal from "decimal.js";
import { TradeDirection, AssetClass, Execution } from "@/types";

// Common futures instrument contract multipliers ($ per full point)
export const FUTURES_MULTIPLIERS: Record<string, number> = {
  ES: 50.0,
  "/ES": 50.0,
  NQ: 20.0,
  "/NQ": 20.0,
  MES: 5.0,
  "/MES": 5.0,
  MNQ: 2.0,
  "/MNQ": 2.0,
  YM: 5.0,
  "/YM": 5.0,
  MYM: 0.5,
  "/MYM": 0.5,
  RTY: 50.0,
  "/RTY": 50.0,
  M2K: 5.0,
  "/M2K": 5.0,
  CL: 1000.0,
  "/CL": 1000.0,
  MCL: 100.0,
  "/MCL": 100.0,
  GC: 100.0,
  "/GC": 100.0,
  MGC: 10.0,
  "/MGC": 10.0,
  SI: 5000.0,
  "/SI": 5000.0,
  ZB: 1000.0,
  "/ZB": 1000.0,
  ZN: 1000.0,
  "/ZN": 1000.0,
};

/**
 * Resolve contract multiplier based on asset class and symbol
 */
export function getContractMultiplier(
  assetClass: AssetClass,
  symbol: string,
  userMultiplier?: number
): number {
  if (userMultiplier && userMultiplier > 0) {
    return userMultiplier;
  }

  if (assetClass === "OPTIONS") {
    return 100.0; // Standard 100 shares per contract
  }

  if (assetClass === "FOREX") {
    return 100000.0; // Standard 100,000 units per lot
  }

  if (assetClass === "FUTURES") {
    // Normalize symbol (e.g. "NQZ4", "ESU4", "/ES" -> root "ES")
    const cleanSymbol = symbol.trim().toUpperCase().replace(/^\//, "");
    const rootSymbol = cleanSymbol.replace(/[FGHJKMNQUVXZ]\d{1,4}$/, "");

    if (FUTURES_MULTIPLIERS[rootSymbol]) {
      return FUTURES_MULTIPLIERS[rootSymbol];
    }
    if (FUTURES_MULTIPLIERS[cleanSymbol]) {
      return FUTURES_MULTIPLIERS[cleanSymbol];
    }
    return 1.0;
  }

  return 1.0;
}

export interface TradeCalculationParams {
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  contractMultiplier?: number;
  fees?: number;
  commissions?: number;
  stopLoss?: number;
  takeProfit?: number;
  customInitialRisk?: number;
}

export interface TradeCalculationResult {
  grossPnl: number;
  netPnl: number;
  fees: number;
  commissions: number;
  totalCosts: number;
  initialRisk: number | null;
  rMultiple: number | null;
  returnPct: number | null;
  isBreakEven: boolean;
  isProfitable: boolean;
}

/**
 * Pure calculation engine for trade performance metrics
 */
export function calculateTradeMetrics(params: TradeCalculationParams): TradeCalculationResult {
  const {
    direction,
    entryPrice,
    exitPrice,
    quantity,
    contractMultiplier = 1.0,
    fees = 0.0,
    commissions = 0.0,
    stopLoss,
    customInitialRisk,
  } = params;

  const dEntry = new Decimal(entryPrice);
  const dQty = new Decimal(quantity);
  const dMultiplier = new Decimal(contractMultiplier);
  const dFees = new Decimal(fees);
  const dCommissions = new Decimal(commissions);
  const totalCosts = dFees.plus(dCommissions);

  // If trade is still OPEN (no exit price yet)
  if (exitPrice === undefined || exitPrice === null) {
    let initialRisk: number | null = null;
    if (customInitialRisk && customInitialRisk > 0) {
      initialRisk = customInitialRisk;
    } else if (stopLoss !== undefined && stopLoss !== null) {
      const dStop = new Decimal(stopLoss);
      if (direction === "LONG") {
        initialRisk = dEntry.minus(dStop).times(dQty).times(dMultiplier).toNumber();
      } else {
        initialRisk = dStop.minus(dEntry).times(dQty).times(dMultiplier).toNumber();
      }
      if (initialRisk < 0) initialRisk = Math.abs(initialRisk);
    }

    return {
      grossPnl: 0,
      netPnl: -totalCosts.toNumber(),
      fees: dFees.toNumber(),
      commissions: dCommissions.toNumber(),
      totalCosts: totalCosts.toNumber(),
      initialRisk,
      rMultiple: null,
      returnPct: null,
      isBreakEven: false,
      isProfitable: false,
    };
  }

  const dExit = new Decimal(exitPrice);

  // 1. Gross P&L
  // Long: (Exit - Entry) * Qty * Multiplier
  // Short: (Entry - Exit) * Qty * Multiplier
  let grossPnlDecimal: Decimal;
  if (direction === "LONG") {
    grossPnlDecimal = dExit.minus(dEntry).times(dQty).times(dMultiplier);
  } else {
    grossPnlDecimal = dEntry.minus(dExit).times(dQty).times(dMultiplier);
  }

  // 2. Net P&L = Gross - Costs
  const netPnlDecimal = grossPnlDecimal.minus(totalCosts);

  // 3. Initial Risk ($)
  let initialRisk: number | null = null;
  if (customInitialRisk && customInitialRisk > 0) {
    initialRisk = customInitialRisk;
  } else if (stopLoss !== undefined && stopLoss !== null) {
    const dStop = new Decimal(stopLoss);
    let riskDecimal: Decimal;
    if (direction === "LONG") {
      riskDecimal = dEntry.minus(dStop).times(dQty).times(dMultiplier);
    } else {
      riskDecimal = dStop.minus(dEntry).times(dQty).times(dMultiplier);
    }
    const rawRisk = riskDecimal.toNumber();
    if (rawRisk > 0) {
      initialRisk = rawRisk;
    }
  }

  // 4. R-Multiple = Net P&L / Initial Risk
  let rMultiple: number | null = null;
  if (initialRisk && initialRisk > 0) {
    rMultiple = netPnlDecimal.dividedBy(new Decimal(initialRisk)).toNumber();
    // Round to 2 decimal places
    rMultiple = Math.round(rMultiple * 100) / 100;
  }

  // 5. Return %
  let returnPct: number | null = null;
  const positionValue = dEntry.times(dQty).times(dMultiplier);
  if (!positionValue.isZero()) {
    returnPct = netPnlDecimal.dividedBy(positionValue).times(100).toNumber();
    returnPct = Math.round(returnPct * 100) / 100;
  }

  const netPnl = netPnlDecimal.toNumber();
  const isBreakEven = Math.abs(netPnl) <= 0.01;
  const isProfitable = netPnl > 0.01;

  return {
    grossPnl: grossPnlDecimal.toNumber(),
    netPnl,
    fees: dFees.toNumber(),
    commissions: dCommissions.toNumber(),
    totalCosts: totalCosts.toNumber(),
    initialRisk,
    rMultiple,
    returnPct,
    isBreakEven,
    isProfitable,
  };
}

/**
 * Calculate position and weighted averages from multi-fill executions (Scale-ins & Scale-outs)
 */
export function calculateFromExecutions(
  direction: TradeDirection,
  executions: Execution[],
  contractMultiplier = 1.0,
  stopLoss?: number
): TradeCalculationParams {
  const entries = executions.filter((e) => e.executionType === "ENTRY");
  const exits = executions.filter((e) => e.executionType === "EXIT");

  if (entries.length === 0) {
    throw new Error("Trade must have at least one entry execution fill.");
  }

  // Calculate Weighted Average Entry Price
  let totalEntryQty = new Decimal(0);
  let totalEntryValue = new Decimal(0);
  let totalFees = new Decimal(0);

  for (const fill of entries) {
    const qty = new Decimal(fill.quantity);
    const price = new Decimal(fill.price);
    totalEntryQty = totalEntryQty.plus(qty);
    totalEntryValue = totalEntryValue.plus(price.times(qty));
    totalFees = totalFees.plus(new Decimal(fill.fees || 0));
  }

  const avgEntryPrice = totalEntryValue.dividedBy(totalEntryQty).toNumber();

  // Calculate Weighted Average Exit Price (if closed)
  let avgExitPrice: number | undefined = undefined;
  if (exits.length > 0) {
    let totalExitQty = new Decimal(0);
    let totalExitValue = new Decimal(0);

    for (const fill of exits) {
      const qty = new Decimal(fill.quantity);
      const price = new Decimal(fill.price);
      totalExitQty = totalExitQty.plus(qty);
      totalExitValue = totalExitValue.plus(price.times(qty));
      totalFees = totalFees.plus(new Decimal(fill.fees || 0));
    }

    if (!totalExitQty.isZero()) {
      avgExitPrice = totalExitValue.dividedBy(totalExitQty).toNumber();
    }
  }

  return {
    direction,
    entryPrice: Math.round(avgEntryPrice * 10000) / 10000,
    exitPrice: avgExitPrice !== undefined ? Math.round(avgExitPrice * 10000) / 10000 : undefined,
    quantity: totalEntryQty.toNumber(),
    contractMultiplier,
    fees: totalFees.toNumber(),
    commissions: 0,
    stopLoss,
  };
}
