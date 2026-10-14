import fs from "fs";
import path from "path";
import { TradingAccount, AccountStatus } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");

function ensureAccountsFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readAccounts(): TradingAccount[] {
  ensureAccountsFile();
  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
    return JSON.parse(raw) as TradingAccount[];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: TradingAccount[]) {
  ensureAccountsFile();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf-8");
}

export class AccountStore {
  static getAll(): TradingAccount[] {
    return readAccounts();
  }

  static findById(id: string): TradingAccount | null {
    const accounts = readAccounts();
    return accounts.find((a) => a.id === id) || null;
  }

  static findByUserId(userId: string, status?: AccountStatus): TradingAccount[] {
    const accounts = readAccounts();
    return accounts.filter((a) => {
      if (a.userId !== userId) return false;
      if (status && a.status !== status) return false;
      return true;
    });
  }

  static create(account: TradingAccount): TradingAccount {
    const accounts = readAccounts();
    accounts.push(account);
    writeAccounts(accounts);
    return account;
  }

  static update(id: string, updates: Partial<TradingAccount>): TradingAccount | null {
    const accounts = readAccounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) return null;

    accounts[index] = {
      ...accounts[index],
      ...updates,
    };

    writeAccounts(accounts);
    return accounts[index];
  }

  static delete(id: string): boolean {
    const accounts = readAccounts();
    const filtered = accounts.filter((a) => a.id !== id);
    if (filtered.length === accounts.length) return false;

    writeAccounts(filtered);
    return true;
  }
}
