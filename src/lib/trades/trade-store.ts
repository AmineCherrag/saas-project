import fs from "fs";
import path from "path";
import { Trade } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const TRADES_FILE = path.join(DATA_DIR, "trades.json");

function ensureTradesFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TRADES_FILE)) {
    fs.writeFileSync(TRADES_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readTrades(): Trade[] {
  ensureTradesFile();
  try {
    const raw = fs.readFileSync(TRADES_FILE, "utf-8");
    return JSON.parse(raw) as Trade[];
  } catch {
    return [];
  }
}

function writeTrades(trades: Trade[]) {
  ensureTradesFile();
  fs.writeFileSync(TRADES_FILE, JSON.stringify(trades, null, 2), "utf-8");
}

export class TradeStore {
  static getAll(): Trade[] {
    return readTrades();
  }

  static findById(id: string): Trade | null {
    const trades = readTrades();
    return trades.find((t) => t.id === id) || null;
  }

  static findByUserId(userId: string): Trade[] {
    const trades = readTrades();
    return trades.filter((t) => t.userId === userId);
  }

  static create(trade: Trade): Trade {
    const trades = readTrades();
    trades.push(trade);
    writeTrades(trades);
    return trade;
  }

  static createMany(newTrades: Trade[]): Trade[] {
    const trades = readTrades();
    trades.push(...newTrades);
    writeTrades(trades);
    return newTrades;
  }

  static update(id: string, updates: Partial<Trade>): Trade | null {
    const trades = readTrades();
    const index = trades.findIndex((t) => t.id === id);
    if (index === -1) return null;

    trades[index] = {
      ...trades[index],
      ...updates,
    };

    writeTrades(trades);
    return trades[index];
  }

  static delete(id: string): boolean {
    const trades = readTrades();
    const filtered = trades.filter((t) => t.id !== id);
    if (filtered.length === trades.length) return false;

    writeTrades(filtered);
    return true;
  }
}
