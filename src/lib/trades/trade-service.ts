import { Trade } from "@/types";
import {
  createTradeSchema,
  updateTradeSchema,
  tradeFilterSchema,
  CreateTradeInput,
  UpdateTradeInput,
  TradeFilters,
} from "./validation";
import { TradeStore } from "./trade-store";
import { AccountService } from "../accounts/account-service";
import { UserStore } from "../auth/user-store";
import {
  calculateTradeMetrics,
  getContractMultiplier,
} from "../trade-engine/calculations";

export class TradeService {
  /**
   * Create a new trade with deterministic mathematical validation
   */
  static createTrade(userId: string, input: CreateTradeInput): Trade {
    const validated = createTradeSchema.parse(input);

    // Verify account ownership
    const account = AccountService.getAccountById(userId, validated.accountId);

    // Determine contract multiplier
    const multiplier = getContractMultiplier(
      validated.assetClass,
      validated.symbol,
      validated.contractMultiplier
    );

    // Compute metrics
    const metrics = calculateTradeMetrics({
      direction: validated.direction,
      entryPrice: validated.entryPrice,
      exitPrice: validated.exitPrice,
      quantity: validated.quantity,
      contractMultiplier: multiplier,
      fees: validated.fees,
      commissions: validated.commissions,
      stopLoss: validated.stopLoss,
      takeProfit: validated.takeProfit,
    });

    const tradeId = `trd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTrade: Trade = {
      id: tradeId,
      userId,
      accountId: account.id,
      accountName: account.name,
      playbookId: validated.playbookId,
      playbookName: validated.playbookName,
      symbol: validated.symbol,
      assetClass: validated.assetClass,
      direction: validated.direction,
      status: validated.status,
      entryTime: validated.entryTime,
      exitTime: validated.exitTime,
      entryPrice: validated.entryPrice,
      exitPrice: validated.exitPrice,
      quantity: validated.quantity,
      contractMultiplier: multiplier,
      stopLoss: validated.stopLoss,
      takeProfit: validated.takeProfit,
      initialRisk: metrics.initialRisk || undefined,
      grossPnl: metrics.grossPnl,
      fees: metrics.fees,
      commissions: metrics.commissions,
      netPnl: metrics.netPnl,
      returnPct: metrics.returnPct || undefined,
      rMultiple: metrics.rMultiple || undefined,
      rating: validated.rating,
      marketSession: validated.marketSession,
      notes: validated.notes,
      tags: validated.tags.map((t) => ({
        id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        tradeId,
        tagType: t.type,
        tagValue: t.value,
      })),
      executions: validated.executions.map((e) => ({
        id: e.id || `exec_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        tradeId,
        executionType: e.executionType,
        orderAction: e.orderAction,
        timestamp: e.timestamp,
        price: e.price,
        quantity: e.quantity,
        fees: e.fees,
        notes: e.notes,
      })),
      createdAt: new Date().toISOString(),
    };

    TradeStore.create(newTrade);

    // If trade was closed, update account balance
    if (newTrade.status === "CLOSED") {
      AccountService.adjustAccountBalance(userId, account.id, newTrade.netPnl);
    }

    UserStore.logAudit({
      userId,
      action: "TRADE_CREATED",
      details: {
        tradeId,
        symbol: newTrade.symbol,
        direction: newTrade.direction,
        netPnl: newTrade.netPnl,
      },
    });

    return newTrade;
  }

  /**
   * Retrieve filtered, sorted and paginated trades for a user
   */
  static getTrades(
    userId: string,
    filtersInput: Partial<TradeFilters> = {}
  ): {
    trades: Trade[];
    pagination: {
      page: number;
      limit: number;
      totalTrades: number;
      totalPages: number;
    };
  } {
    const filters = tradeFilterSchema.parse(filtersInput);
    let allUserTrades = TradeStore.findByUserId(userId);

    // Filter by Account
    if (filters.accountId && filters.accountId !== "all") {
      allUserTrades = allUserTrades.filter((t) => t.accountId === filters.accountId);
    }

    // Filter by Asset Class
    if (filters.assetClass) {
      allUserTrades = allUserTrades.filter((t) => t.assetClass === filters.assetClass);
    }

    // Filter by Direction
    if (filters.direction) {
      allUserTrades = allUserTrades.filter((t) => t.direction === filters.direction);
    }

    // Filter by Symbol
    if (filters.symbol) {
      allUserTrades = allUserTrades.filter((t) =>
        t.symbol.toUpperCase().includes(filters.symbol!.toUpperCase())
      );
    }

    // Filter by Status
    if (filters.status) {
      allUserTrades = allUserTrades.filter((t) => t.status === filters.status);
    }

    // Filter by Start Date
    if (filters.startDate) {
      allUserTrades = allUserTrades.filter(
        (t) => new Date(t.entryTime) >= new Date(filters.startDate!)
      );
    }

    // Filter by End Date
    if (filters.endDate) {
      allUserTrades = allUserTrades.filter(
        (t) => new Date(t.entryTime) <= new Date(filters.endDate!)
      );
    }

    // Sort
    allUserTrades.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (filters.sortBy === "entryTime") {
        valA = new Date(a.entryTime).getTime();
        valB = new Date(b.entryTime).getTime();
      } else if (filters.sortBy === "netPnl") {
        valA = a.netPnl;
        valB = b.netPnl;
      } else if (filters.sortBy === "rMultiple") {
        valA = a.rMultiple || 0;
        valB = b.rMultiple || 0;
      } else if (filters.sortBy === "returnPct") {
        valA = a.returnPct || 0;
        valB = b.returnPct || 0;
      }

      if (filters.sortOrder === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    const totalTrades = allUserTrades.length;
    const totalPages = Math.ceil(totalTrades / filters.limit) || 1;
    const startIndex = (filters.page - 1) * filters.limit;
    const paginatedTrades = allUserTrades.slice(startIndex, startIndex + filters.limit);

    return {
      trades: paginatedTrades,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalTrades,
        totalPages,
      },
    };
  }

  /**
   * Get single trade with strict tenant isolation
   */
  static getTradeById(userId: string, tradeId: string): Trade {
    const trade = TradeStore.findById(tradeId);
    if (!trade || trade.userId !== userId) {
      throw new Error("Trade record not found or access denied.");
    }
    return trade;
  }

  /**
   * Update trade details and reconcile balance delta
   */
  static updateTrade(userId: string, tradeId: string, input: UpdateTradeInput): Trade {
    const existing = this.getTradeById(userId, tradeId);
    const validated = updateTradeSchema.parse(input);

    const mergedDirection = validated.direction || existing.direction;
    const mergedEntryPrice = validated.entryPrice ?? existing.entryPrice;
    const mergedExitPrice = validated.exitPrice ?? existing.exitPrice;
    const mergedQty = validated.quantity ?? existing.quantity;
    const mergedMultiplier = validated.contractMultiplier ?? existing.contractMultiplier;
    const mergedFees = validated.fees ?? existing.fees;
    const mergedCommissions = validated.commissions ?? existing.commissions;
    const mergedStopLoss = validated.stopLoss ?? existing.stopLoss;

    // Recalculate metrics
    const metrics = calculateTradeMetrics({
      direction: mergedDirection,
      entryPrice: mergedEntryPrice,
      exitPrice: mergedExitPrice,
      quantity: mergedQty,
      contractMultiplier: mergedMultiplier,
      fees: mergedFees,
      commissions: mergedCommissions,
      stopLoss: mergedStopLoss,
    });

    const mappedTags = validated.tags
      ? validated.tags.map((t) => ({
          id: t.id || `tag_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          tradeId: existing.id,
          tagType: t.type,
          tagValue: t.value,
        }))
      : undefined;

    const mappedExecutions = validated.executions
      ? validated.executions.map((e) => ({
          id: e.id || `exec_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          tradeId: existing.id,
          executionType: e.executionType,
          orderAction: e.orderAction,
          timestamp: e.timestamp,
          price: e.price,
          quantity: e.quantity,
          fees: e.fees,
          notes: e.notes,
        }))
      : undefined;

    const netPnlDelta = metrics.netPnl - existing.netPnl;

    const updatePayload: Partial<Trade> = {
      ...validated,
      tags: mappedTags || existing.tags,
      executions: mappedExecutions || existing.executions,
      grossPnl: metrics.grossPnl,
      netPnl: metrics.netPnl,
      fees: metrics.fees,
      commissions: metrics.commissions,
      initialRisk: metrics.initialRisk || undefined,
      rMultiple: metrics.rMultiple || undefined,
      returnPct: metrics.returnPct || undefined,
    };

    const updated = TradeStore.update(existing.id, updatePayload);
    if (!updated) {
      throw new Error("Failed to update trade record.");
    }

    // Reconcile balance difference if closed
    if (existing.status === "CLOSED" && netPnlDelta !== 0) {
      AccountService.adjustAccountBalance(userId, existing.accountId, netPnlDelta);
    }

    UserStore.logAudit({
      userId,
      action: "TRADE_UPDATED",
      details: { tradeId, netPnlDelta },
    });

    return updated;
  }

  /**
   * Delete trade and reverse balance contribution
   */
  static deleteTrade(userId: string, tradeId: string): boolean {
    const existing = this.getTradeById(userId, tradeId);

    // Reverse account balance adjustment
    if (existing.status === "CLOSED") {
      AccountService.adjustAccountBalance(userId, existing.accountId, -existing.netPnl);
    }

    const success = TradeStore.delete(existing.id);

    if (success) {
      UserStore.logAudit({
        userId,
        action: "TRADE_DELETED",
        details: { tradeId },
      });
    }

    return success;
  }

  /**
   * Duplicate trade for rapid trade entry
   */
  static duplicateTrade(userId: string, tradeId: string): Trade {
    const existing = this.getTradeById(userId, tradeId);

    return this.createTrade(userId, {
      accountId: existing.accountId,
      symbol: existing.symbol,
      assetClass: existing.assetClass,
      direction: existing.direction,
      status: "OPEN",
      entryTime: new Date().toISOString(),
      entryPrice: existing.entryPrice,
      quantity: existing.quantity,
      contractMultiplier: existing.contractMultiplier,
      stopLoss: existing.stopLoss,
      takeProfit: existing.takeProfit,
      fees: existing.fees,
      commissions: existing.commissions,
      playbookId: existing.playbookId,
      playbookName: existing.playbookName,
      rating: existing.rating ?? 3,
      marketSession: existing.marketSession,
      notes: existing.notes ? `Copy of ${existing.notes}` : undefined,
    });
  }
}
