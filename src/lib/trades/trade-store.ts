import { Trade } from "@/types";
import { prisma, isPostgresDatabase } from "../db/prisma";

const inMemoryTrades = new Map<string, Trade>();

function mapDbTradeToTrade(dbTrade: any): Trade {
  return {
    id: dbTrade.id,
    userId: dbTrade.userId,
    accountId: dbTrade.accountId,
    accountName: dbTrade.account?.name,
    playbookId: dbTrade.playbookId || undefined,
    playbookName: dbTrade.playbook?.name,
    symbol: dbTrade.symbol,
    assetClass: dbTrade.assetClass,
    direction: dbTrade.direction,
    status: dbTrade.status,
    entryTime: dbTrade.entryTime instanceof Date ? dbTrade.entryTime.toISOString() : String(dbTrade.entryTime),
    exitTime: dbTrade.exitTime ? (dbTrade.exitTime instanceof Date ? dbTrade.exitTime.toISOString() : String(dbTrade.exitTime)) : undefined,
    entryPrice: Number(dbTrade.entryPrice),
    exitPrice: dbTrade.exitPrice ? Number(dbTrade.exitPrice) : undefined,
    quantity: Number(dbTrade.quantity),
    contractMultiplier: Number(dbTrade.contractMultiplier ?? 1.0),
    stopLoss: dbTrade.stopLoss ? Number(dbTrade.stopLoss) : undefined,
    takeProfit: dbTrade.takeProfit ? Number(dbTrade.takeProfit) : undefined,
    initialRisk: dbTrade.initialRisk ? Number(dbTrade.initialRisk) : undefined,
    grossPnl: Number(dbTrade.grossPnl ?? 0),
    fees: Number(dbTrade.fees ?? 0),
    commissions: Number(dbTrade.commissions ?? 0),
    netPnl: Number(dbTrade.netPnl ?? 0),
    returnPct: dbTrade.returnPct ? Number(dbTrade.returnPct) : undefined,
    rMultiple: dbTrade.rMultiple ? Number(dbTrade.rMultiple) : undefined,
    rating: dbTrade.rating ?? 3,
    marketSession: dbTrade.marketSession || undefined,
    notes: dbTrade.notes || undefined,
    createdAt: dbTrade.createdAt instanceof Date ? dbTrade.createdAt.toISOString() : String(dbTrade.createdAt),
  };
}

export class TradeStore {
  static getAll(): Trade[] {
    if (isPostgresDatabase()) {
      prisma.trade.findMany()
        .then((trades) => {
          for (const t of trades) inMemoryTrades.set(t.id, mapDbTradeToTrade(t));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryTrades.values());
  }

  static async getAllAsync(): Promise<Trade[]> {
    if (isPostgresDatabase()) {
      try {
        const trades = await prisma.trade.findMany();
        const mapped = trades.map(mapDbTradeToTrade);
        for (const t of mapped) inMemoryTrades.set(t.id, t);
        return mapped;
      } catch (e) {
        console.warn("[TradeStore.getAllAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return Array.from(inMemoryTrades.values());
  }

  static findById(id: string): Trade | null {
    if (isPostgresDatabase()) {
      prisma.trade.findUnique({ where: { id } })
        .then((t) => {
          if (t) inMemoryTrades.set(t.id, mapDbTradeToTrade(t));
        })
        .catch(() => {});
    }
    return inMemoryTrades.get(id) || null;
  }

  static async findByIdAsync(id: string): Promise<Trade | null> {
    if (isPostgresDatabase()) {
      try {
        const t = await prisma.trade.findUnique({ where: { id } });
        if (t) {
          const mapped = mapDbTradeToTrade(t);
          inMemoryTrades.set(mapped.id, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[TradeStore.findByIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return inMemoryTrades.get(id) || null;
  }

  static findByUserId(userId: string): Trade[] {
    if (isPostgresDatabase()) {
      prisma.trade.findMany({ where: { userId } })
        .then((trades) => {
          for (const t of trades) inMemoryTrades.set(t.id, mapDbTradeToTrade(t));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryTrades.values()).filter((t) => t.userId === userId);
  }

  static async findByUserIdAsync(userId: string): Promise<Trade[]> {
    if (isPostgresDatabase()) {
      try {
        const trades = await prisma.trade.findMany({ where: { userId } });
        const mapped = trades.map(mapDbTradeToTrade);
        for (const t of mapped) inMemoryTrades.set(t.id, t);
        return mapped;
      } catch (e) {
        console.warn("[TradeStore.findByUserIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return this.findByUserId(userId);
  }

  static create(trade: Trade): Trade {
    inMemoryTrades.set(trade.id, { ...trade });

    if (isPostgresDatabase()) {
      prisma.trade.upsert({
        where: { id: trade.id },
        create: {
          id: trade.id,
          userId: trade.userId,
          accountId: trade.accountId,
          playbookId: trade.playbookId || null,
          symbol: trade.symbol,
          assetClass: trade.assetClass as any,
          direction: trade.direction as any,
          status: trade.status as any,
          entryTime: new Date(trade.entryTime),
          exitTime: trade.exitTime ? new Date(trade.exitTime) : null,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice ?? null,
          quantity: trade.quantity,
          contractMultiplier: trade.contractMultiplier ?? 1.0,
          stopLoss: trade.stopLoss ?? null,
          takeProfit: trade.takeProfit ?? null,
          initialRisk: trade.initialRisk ?? null,
          grossPnl: trade.grossPnl ?? 0,
          fees: trade.fees ?? 0,
          commissions: trade.commissions ?? 0,
          netPnl: trade.netPnl ?? 0,
          returnPct: trade.returnPct ?? null,
          rMultiple: trade.rMultiple ?? null,
          rating: trade.rating ?? 3,
          marketSession: trade.marketSession || null,
          notes: trade.notes || null,
          createdAt: new Date(trade.createdAt),
        },
        update: {
          symbol: trade.symbol,
          direction: trade.direction as any,
          status: trade.status as any,
          entryTime: new Date(trade.entryTime),
          exitTime: trade.exitTime ? new Date(trade.exitTime) : null,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice ?? null,
          quantity: trade.quantity,
          contractMultiplier: trade.contractMultiplier ?? 1.0,
          stopLoss: trade.stopLoss ?? null,
          takeProfit: trade.takeProfit ?? null,
          initialRisk: trade.initialRisk ?? null,
          grossPnl: trade.grossPnl ?? 0,
          fees: trade.fees ?? 0,
          commissions: trade.commissions ?? 0,
          netPnl: trade.netPnl ?? 0,
          returnPct: trade.returnPct ?? null,
          rMultiple: trade.rMultiple ?? null,
          rating: trade.rating ?? 3,
          marketSession: trade.marketSession || null,
          notes: trade.notes || null,
        },
      }).catch((e) => {
        console.warn("[TradeStore.create] PostgreSQL write error:", e);
      });
    }

    return trade;
  }

  static createMany(newTrades: Trade[]): Trade[] {
    for (const t of newTrades) {
      this.create(t);
    }
    return newTrades;
  }

  static update(id: string, updates: Partial<Trade>): Trade | null {
    const existing = inMemoryTrades.get(id);
    if (!existing) return null;

    const updated: Trade = {
      ...existing,
      ...updates,
    };
    inMemoryTrades.set(id, updated);

    if (isPostgresDatabase()) {
      prisma.trade.update({
        where: { id },
        data: {
          symbol: updates.symbol,
          direction: updates.direction as any,
          status: updates.status as any,
          entryTime: updates.entryTime ? new Date(updates.entryTime) : undefined,
          exitTime: updates.exitTime ? new Date(updates.exitTime) : undefined,
          entryPrice: updates.entryPrice,
          exitPrice: updates.exitPrice,
          quantity: updates.quantity,
          contractMultiplier: updates.contractMultiplier,
          stopLoss: updates.stopLoss,
          takeProfit: updates.takeProfit,
          initialRisk: updates.initialRisk,
          grossPnl: updates.grossPnl,
          fees: updates.fees,
          commissions: updates.commissions,
          netPnl: updates.netPnl,
          returnPct: updates.returnPct,
          rMultiple: updates.rMultiple,
          rating: updates.rating,
          marketSession: updates.marketSession,
          notes: updates.notes,
        },
      }).catch((e) => {
        console.warn("[TradeStore.update] PostgreSQL update error:", e);
      });
    }

    return updated;
  }

  static delete(id: string): boolean {
    const existed = inMemoryTrades.delete(id);
    if (!existed) return false;

    if (isPostgresDatabase()) {
      prisma.trade.delete({ where: { id } }).catch((e) => {
        console.warn("[TradeStore.delete] PostgreSQL delete error:", e);
      });
    }

    return true;
  }

  static clear(): void {
    inMemoryTrades.clear();
  }
}
