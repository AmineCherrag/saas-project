import { TradeDirection, AssetClass } from "@/types";

export interface ColumnMapping {
  symbolColumn: string;
  directionColumn: string;
  entryTimeColumn: string;
  exitTimeColumn?: string;
  entryPriceColumn: string;
  exitPriceColumn?: string;
  quantityColumn: string;
  feesColumn?: string;
  commissionsColumn?: string;
  contractMultiplierColumn?: string;
  stopLossColumn?: string;
  takeProfitColumn?: string;
  notesColumn?: string;
}

export interface BrokerPreset {
  id: string;
  name: string;
  description: string;
  defaultMapping: ColumnMapping;
  sampleHeaders: string[];
}

export const BROKER_PRESETS: Record<string, BrokerPreset> = {
  universal: {
    id: "universal",
    name: "Universal / TradePulse Standard Format",
    description: "Standard generic CSV format with explicit entry, exit, and fee columns",
    defaultMapping: {
      symbolColumn: "Symbol",
      directionColumn: "Direction",
      entryTimeColumn: "Entry Time",
      exitTimeColumn: "Exit Time",
      entryPriceColumn: "Entry Price",
      exitPriceColumn: "Exit Price",
      quantityColumn: "Quantity",
      feesColumn: "Fees",
      commissionsColumn: "Commissions",
      contractMultiplierColumn: "Multiplier",
      stopLossColumn: "Stop Loss",
      takeProfitColumn: "Take Profit",
      notesColumn: "Notes",
    },
    sampleHeaders: [
      "Symbol",
      "Direction",
      "Entry Time",
      "Exit Time",
      "Entry Price",
      "Exit Price",
      "Quantity",
      "Fees",
      "Commissions",
      "Multiplier",
      "Stop Loss",
      "Take Profit",
      "Notes",
    ],
  },
  tradovate: {
    id: "tradovate",
    name: "Tradovate (Futures)",
    description: "Orders & fills report from Tradovate desktop/web platform",
    defaultMapping: {
      symbolColumn: "Contract",
      directionColumn: "B/S",
      entryTimeColumn: "Timestamp",
      entryPriceColumn: "Avg Price",
      quantityColumn: "Filled Qty",
      feesColumn: "Commission",
    },
    sampleHeaders: [
      "Timestamp",
      "Contract",
      "B/S",
      "Filled Qty",
      "Avg Price",
      "Commission",
      "Status",
    ],
  },
  thinkorswim: {
    id: "thinkorswim",
    name: "ThinkorSwim / Schwab (Equities & Options)",
    description: "Account Statement trade activity CSV from ThinkorSwim",
    defaultMapping: {
      symbolColumn: "Symbol",
      directionColumn: "Side",
      entryTimeColumn: "Exec Time",
      entryPriceColumn: "Price",
      quantityColumn: "Qty",
      feesColumn: "Fees",
    },
    sampleHeaders: [
      "Exec Time",
      "Spread",
      "Side",
      "Qty",
      "Pos Effect",
      "Symbol",
      "Exp",
      "Strike",
      "Type",
      "Price",
      "Net Price",
      "Order Type",
    ],
  },
  ninjatrader: {
    id: "ninjatrader",
    name: "NinjaTrader 8 (Futures)",
    description: "Executions grid export from NinjaTrader 8 Control Center",
    defaultMapping: {
      symbolColumn: "Instrument",
      directionColumn: "Action",
      entryTimeColumn: "Time",
      entryPriceColumn: "Price",
      quantityColumn: "Qty",
      feesColumn: "Commission",
    },
    sampleHeaders: [
      "Time",
      "Instrument",
      "Action",
      "Qty",
      "Price",
      "Commission",
      "Account",
    ],
  },
  metatrader: {
    id: "metatrader",
    name: "MetaTrader 4 / 5 (Forex & CFDs)",
    description: "Closed trades history report from MT4 or MT5",
    defaultMapping: {
      symbolColumn: "Symbol",
      directionColumn: "Type",
      entryTimeColumn: "Open Time",
      exitTimeColumn: "Close Time",
      entryPriceColumn: "Open Price",
      exitPriceColumn: "Close Price",
      quantityColumn: "Volume",
      feesColumn: "Commission",
      stopLossColumn: "S / L",
      takeProfitColumn: "T / P",
    },
    sampleHeaders: [
      "Open Time",
      "Type",
      "Volume",
      "Symbol",
      "Open Price",
      "S / L",
      "T / P",
      "Close Time",
      "Close Price",
      "Commission",
      "Swap",
      "Profit",
    ],
  },
  interactivebrokers: {
    id: "interactivebrokers",
    name: "Interactive Brokers (Flex Query)",
    description: "Trade Confirmation Flex Query from IBKR Client Portal",
    defaultMapping: {
      symbolColumn: "Symbol",
      directionColumn: "Buy/Sell",
      entryTimeColumn: "DateTime",
      entryPriceColumn: "TradePrice",
      quantityColumn: "Quantity",
      feesColumn: "IBCommission",
      contractMultiplierColumn: "Multiplier",
    },
    sampleHeaders: [
      "DateTime",
      "Symbol",
      "Buy/Sell",
      "Quantity",
      "TradePrice",
      "IBCommission",
      "Multiplier",
      "AssetClass",
    ],
  },
};

/**
 * Normalize Direction string (e.g. "BUY", "BOT", "LONG", "B" -> "LONG"; "SELL", "SLD", "SHORT", "S" -> "SHORT")
 */
export function normalizeDirection(raw: string): TradeDirection {
  const clean = raw.trim().toUpperCase();
  if (
    clean === "BUY" ||
    clean === "BOT" ||
    clean === "B" ||
    clean === "LONG" ||
    clean === "1"
  ) {
    return "LONG";
  }
  if (
    clean === "SELL" ||
    clean === "SLD" ||
    clean === "S" ||
    clean === "SHORT" ||
    clean === "SSHORT" ||
    clean === "-1"
  ) {
    return "SHORT";
  }
  return "LONG"; // Fallback default
}

/**
 * Robust date parser supporting varied financial timestamp formats
 */
export function normalizeTimestamp(rawDate: string): string {
  if (!rawDate) return new Date().toISOString();

  const clean = rawDate.trim();

  // Try standard Date parsing
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  // Handle MM/DD/YYYY or DD/MM/YYYY with time
  const match = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (match) {
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const month = parseInt(match[1], 10) - 1;
    const day = parseInt(match[2], 10);
    const hours = match[4] ? parseInt(match[4], 10) : 0;
    const minutes = match[5] ? parseInt(match[5], 10) : 0;
    const seconds = match[6] ? parseInt(match[6], 10) : 0;

    const reconstructed = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    if (!isNaN(reconstructed.getTime())) {
      return reconstructed.toISOString();
    }
  }

  return new Date().toISOString();
}

/**
 * Automatically guess the best broker preset based on detected CSV headers
 */
export function detectBrokerPreset(headers: string[]): string {
  const upperHeaders = headers.map((h) => h.trim().toUpperCase());

  if (upperHeaders.includes("CONTRACT") && upperHeaders.includes("B/S")) {
    return "tradovate";
  }
  if (upperHeaders.includes("EXEC TIME") && upperHeaders.includes("POS EFFECT")) {
    return "thinkorswim";
  }
  if (upperHeaders.includes("INSTRUMENT") && upperHeaders.includes("ACTION")) {
    return "ninjatrader";
  }
  if (upperHeaders.includes("OPEN TIME") && upperHeaders.includes("CLOSE TIME")) {
    return "metatrader";
  }
  if (upperHeaders.includes("BUY/SELL") && upperHeaders.includes("TRADEPRICE")) {
    return "interactivebrokers";
  }

  return "universal";
}
