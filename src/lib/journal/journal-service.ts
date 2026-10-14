import { JournalEntry, Trade } from "@/types";
import { JournalStore } from "./journal-store";
import { TradeStore } from "../trades/trade-store";
import { UserStore } from "../auth/user-store";

export interface UpsertJournalInput {
  entryDate: string; // YYYY-MM-DD
  title: string;
  preSessionPlan?: string;
  postSessionReview?: string;
  emotionalScore?: number;
  marketSentiment?: "Bullish" | "Bearish" | "Neutral";
  tags?: string[];
}

export interface DayJournalDetail {
  entry: JournalEntry | null;
  trades: Trade[];
  dayNetPnl: number;
  tradeCount: number;
  winningCount: number;
  losingCount: number;
}

export class JournalService {
  /**
   * Save or update daily journal entry
   */
  static upsertEntry(userId: string, input: UpsertJournalInput): JournalEntry {
    const existing = JournalStore.findByDate(userId, input.entryDate);

    if (existing) {
      const updated = JournalStore.update(existing.id, {
        title: input.title,
        preSessionPlan: input.preSessionPlan,
        postSessionReview: input.postSessionReview,
        emotionalScore: input.emotionalScore,
        marketSentiment: input.marketSentiment,
        tags: input.tags,
      });

      UserStore.logAudit({
        userId,
        action: "JOURNAL_UPDATED",
        details: { journalId: existing.id, entryDate: input.entryDate },
      });

      return updated!;
    }

    const journalId = `jrn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newEntry: JournalEntry = {
      id: journalId,
      userId,
      entryDate: input.entryDate,
      title: input.title,
      preSessionPlan: input.preSessionPlan,
      postSessionReview: input.postSessionReview,
      emotionalScore: input.emotionalScore ?? 7,
      marketSentiment: input.marketSentiment ?? "Neutral",
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    JournalStore.create(newEntry);

    UserStore.logAudit({
      userId,
      action: "JOURNAL_CREATED",
      details: { journalId, entryDate: input.entryDate },
    });

    return newEntry;
  }

  /**
   * Get detailed day journal along with all trades executed on that date
   */
  static getDayDetail(userId: string, entryDate: string): DayJournalDetail {
    const entry = JournalStore.findByDate(userId, entryDate);

    // Find all trades executed on this date
    const dayTrades = TradeStore.findByUserId(userId).filter(
      (t) => t.entryTime.substring(0, 10) === entryDate
    );

    let dayNetPnl = 0;
    let winningCount = 0;
    let losingCount = 0;

    for (const t of dayTrades) {
      dayNetPnl += t.netPnl;
      if (t.netPnl > 0) winningCount++;
      else if (t.netPnl < 0) losingCount++;
    }

    return {
      entry,
      trades: dayTrades,
      dayNetPnl: Math.round(dayNetPnl * 100) / 100,
      tradeCount: dayTrades.length,
      winningCount,
      losingCount,
    };
  }

  /**
   * Get all journal entries for a user
   */
  static getUserEntries(userId: string): JournalEntry[] {
    return JournalStore.findByUserId(userId);
  }

  /**
   * Delete journal entry
   */
  static deleteEntry(userId: string, id: string): boolean {
    const entry = JournalStore.findById(id);
    if (!entry || entry.userId !== userId) {
      throw new Error("Journal entry not found or access denied.");
    }

    const success = JournalStore.delete(id);
    if (success) {
      UserStore.logAudit({
        userId,
        action: "JOURNAL_DELETED",
        details: { journalId: id },
      });
    }
    return success;
  }
}
