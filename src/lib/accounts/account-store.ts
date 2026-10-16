import { TradingAccount, AccountStatus } from "@/types";
import { prisma, isPostgresDatabase } from "../db/prisma";

const inMemoryAccounts = new Map<string, TradingAccount>();

function mapDbAccountToTradingAccount(dbAcc: any): TradingAccount {
  return {
    id: dbAcc.id,
    userId: dbAcc.userId,
    name: dbAcc.name,
    brokerName: dbAcc.brokerName,
    accountType: dbAcc.accountType,
    assetClass: dbAcc.assetClass,
    initialBalance: Number(dbAcc.initialBalance),
    currentBalance: Number(dbAcc.currentBalance),
    currency: dbAcc.currency || "USD",
    status: dbAcc.status,
    description: dbAcc.description || undefined,
    createdAt: dbAcc.createdAt instanceof Date ? dbAcc.createdAt.toISOString() : String(dbAcc.createdAt),
  };
}

export class AccountStore {
  static getAll(): TradingAccount[] {
    if (isPostgresDatabase()) {
      prisma.tradingAccount.findMany()
        .then((accounts) => {
          for (const a of accounts) inMemoryAccounts.set(a.id, mapDbAccountToTradingAccount(a));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryAccounts.values());
  }

  static async getAllAsync(): Promise<TradingAccount[]> {
    if (isPostgresDatabase()) {
      try {
        const accounts = await prisma.tradingAccount.findMany();
        const mapped = accounts.map(mapDbAccountToTradingAccount);
        for (const a of mapped) inMemoryAccounts.set(a.id, a);
        return mapped;
      } catch (e) {
        console.warn("[AccountStore.getAllAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return Array.from(inMemoryAccounts.values());
  }

  static findById(id: string): TradingAccount | null {
    if (isPostgresDatabase()) {
      prisma.tradingAccount.findUnique({ where: { id } })
        .then((a) => {
          if (a) inMemoryAccounts.set(a.id, mapDbAccountToTradingAccount(a));
        })
        .catch(() => {});
    }
    return inMemoryAccounts.get(id) || null;
  }

  static async findByIdAsync(id: string): Promise<TradingAccount | null> {
    if (isPostgresDatabase()) {
      try {
        const a = await prisma.tradingAccount.findUnique({ where: { id } });
        if (a) {
          const mapped = mapDbAccountToTradingAccount(a);
          inMemoryAccounts.set(mapped.id, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[AccountStore.findByIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return inMemoryAccounts.get(id) || null;
  }

  static findByUserId(userId: string, status?: AccountStatus): TradingAccount[] {
    if (isPostgresDatabase()) {
      prisma.tradingAccount.findMany({ where: { userId, ...(status ? { status } : {}) } })
        .then((accounts) => {
          for (const a of accounts) inMemoryAccounts.set(a.id, mapDbAccountToTradingAccount(a));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryAccounts.values()).filter((a) => {
      if (a.userId !== userId) return false;
      if (status && a.status !== status) return false;
      return true;
    });
  }

  static async findByUserIdAsync(userId: string, status?: AccountStatus): Promise<TradingAccount[]> {
    if (isPostgresDatabase()) {
      try {
        const accounts = await prisma.tradingAccount.findMany({
          where: { userId, ...(status ? { status } : {}) },
        });
        const mapped = accounts.map(mapDbAccountToTradingAccount);
        for (const a of mapped) inMemoryAccounts.set(a.id, a);
        return mapped;
      } catch (e) {
        console.warn("[AccountStore.findByUserIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return this.findByUserId(userId, status);
  }

  static create(account: TradingAccount): TradingAccount {
    inMemoryAccounts.set(account.id, { ...account });

    if (isPostgresDatabase()) {
      prisma.tradingAccount.upsert({
        where: { id: account.id },
        create: {
          id: account.id,
          userId: account.userId,
          name: account.name,
          brokerName: account.brokerName,
          accountType: account.accountType as any,
          assetClass: account.assetClass as any,
          initialBalance: account.initialBalance,
          currentBalance: account.currentBalance,
          currency: account.currency,
          status: account.status as any,
          description: account.description,
          createdAt: new Date(account.createdAt),
        },
        update: {
          name: account.name,
          brokerName: account.brokerName,
          accountType: account.accountType as any,
          assetClass: account.assetClass as any,
          initialBalance: account.initialBalance,
          currentBalance: account.currentBalance,
          currency: account.currency,
          status: account.status as any,
          description: account.description,
        },
      }).catch((e) => {
        console.warn("[AccountStore.create] PostgreSQL write error:", e);
      });
    }

    return account;
  }

  static update(id: string, updates: Partial<TradingAccount>): TradingAccount | null {
    const existing = inMemoryAccounts.get(id);
    if (!existing) return null;

    const updated: TradingAccount = {
      ...existing,
      ...updates,
    };
    inMemoryAccounts.set(id, updated);

    if (isPostgresDatabase()) {
      prisma.tradingAccount.update({
        where: { id },
        data: {
          name: updates.name,
          brokerName: updates.brokerName,
          accountType: updates.accountType as any,
          assetClass: updates.assetClass as any,
          initialBalance: updates.initialBalance,
          currentBalance: updates.currentBalance,
          currency: updates.currency,
          status: updates.status as any,
          description: updates.description,
        },
      }).catch((e) => {
        console.warn("[AccountStore.update] PostgreSQL update error:", e);
      });
    }

    return updated;
  }

  static delete(id: string): boolean {
    const existed = inMemoryAccounts.delete(id);
    if (!existed) return false;

    if (isPostgresDatabase()) {
      prisma.tradingAccount.delete({ where: { id } }).catch((e) => {
        console.warn("[AccountStore.delete] PostgreSQL delete error:", e);
      });
    }

    return true;
  }

  static clear(): void {
    inMemoryAccounts.clear();
  }
}
