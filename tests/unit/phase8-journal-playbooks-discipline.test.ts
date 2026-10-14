import { describe, it, expect, beforeEach } from "vitest";
import { JournalService } from "@/lib/journal/journal-service";
import { JournalStore } from "@/lib/journal/journal-store";
import { PlaybookService } from "@/lib/playbooks/playbook-service";
import { PlaybookStore } from "@/lib/playbooks/playbook-store";
import { DisciplineService } from "@/lib/discipline/discipline-service";
import { DisciplineStore } from "@/lib/discipline/discipline-store";
import { TradeService } from "@/lib/trades/trade-service";
import { AccountService } from "@/lib/accounts/account-service";
import { UserStore } from "@/lib/auth/user-store";

describe("Phase 8: Daily Journal, Playbooks & Discipline Tracker", () => {
  let userAId: string;
  let userBId: string;
  let accountAId: string;

  beforeEach(() => {
    // Clear stores
    JournalStore.clear();
    PlaybookStore.clear();
    DisciplineStore.clear();

    // User A
    const idA = `usr_p8_a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userA = UserStore.create({
      id: idA,
      email: `${idA}@tradepulse.io`,
      passwordHash: "hash",
      name: "Journal User A",
      role: "USER",
      baseCurrency: "USD",
      timezone: "America/New_York",
      emailVerified: true,
      createdAt: new Date().toISOString(),
    });
    userAId = userA.id;

    // User B
    const idB = `usr_p8_b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userB = UserStore.create({
      id: idB,
      email: `${idB}@tradepulse.io`,
      passwordHash: "hash",
      name: "Journal User B",
      role: "USER",
      baseCurrency: "USD",
      timezone: "America/New_York",
      emailVerified: true,
      createdAt: new Date().toISOString(),
    });
    userBId = userB.id;

    const accA = AccountService.createAccount(userAId, {
      name: "Apex 50k Futures",
      brokerName: "Tradovate",
      accountType: "PROP_FUNDED",
      assetClass: "FUTURES",
      initialBalance: 50000,
      currency: "USD",
    });
    accountAId = accA.id;
  });

  describe("Daily Trading Journal", () => {
    it("creates, updates, and fetches daily journal entries", () => {
      // Upsert entry for 2026-10-12
      const created = JournalService.upsertEntry(userAId, {
        entryDate: "2026-10-12",
        title: "CPI Morning Plan",
        preSessionPlan: "Wait for 15-min opening range breakout after CPI release.",
        emotionalScore: 8,
        marketSentiment: "Bullish",
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe("CPI Morning Plan");

      // Update same date
      const updated = JournalService.upsertEntry(userAId, {
        entryDate: "2026-10-12",
        title: "CPI Morning Plan (Executed)",
        postSessionReview: "Followed the plan cleanly, exited at 2R target.",
        emotionalScore: 9,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe("CPI Morning Plan (Executed)");
      expect(updated.postSessionReview).toContain("Followed the plan");
      expect(updated.emotionalScore).toBe(9);

      // Verify list
      const list = JournalService.getUserEntries(userAId);
      expect(list.length).toBe(1);
    });

    it("aggregates day executions and net P&L with the daily journal", () => {
      // Create trades on 2026-10-12
      TradeService.createTrade(userAId, {
        accountId: accountAId,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-12T14:30:00Z",
        entryPrice: 5800.0,
        exitPrice: 5810.0,
        quantity: 1, // +$500
      });

      TradeService.createTrade(userAId, {
        accountId: accountAId,
        symbol: "NQ",
        assetClass: "FUTURES",
        direction: "SHORT",
        status: "CLOSED",
        entryTime: "2026-10-12T15:00:00Z",
        entryPrice: 20500.0,
        exitPrice: 20510.0,
        quantity: 1, // -$200
      });

      JournalService.upsertEntry(userAId, {
        entryDate: "2026-10-12",
        title: "Review for Oct 12",
      });

      const dayDetail = JournalService.getDayDetail(userAId, "2026-10-12");
      expect(dayDetail.entry).toBeDefined();
      expect(dayDetail.trades.length).toBe(2);
      expect(dayDetail.dayNetPnl).toBe(300); // 500 - 200 = 300
      expect(dayDetail.winningCount).toBe(1);
      expect(dayDetail.losingCount).toBe(1);
    });

    it("deletes journal entries cleanly", () => {
      const entry = JournalService.upsertEntry(userAId, {
        entryDate: "2026-10-13",
        title: "Temporary Entry",
      });

      const deleted = JournalService.deleteEntry(userAId, entry.id);
      expect(deleted).toBe(true);

      const list = JournalService.getUserEntries(userAId);
      expect(list.length).toBe(0);
    });
  });

  describe("Strategy Playbooks Repository", () => {
    it("creates playbook strategies and computes live trade stats", () => {
      const pb = PlaybookService.createPlaybook(userAId, {
        name: "Opening Range Breakout",
        description: "15-minute range breakout on ES/NQ",
        setupRules: "Price above VWAP, range break with volume",
        entryCriteria: "Candle close outside range",
        exitCriteria: "2R or VWAP reclaim",
        riskRules: "Max $500 risk",
        preferredSession: "NY Open",
      });

      expect(pb.id).toBeDefined();
      expect(pb.name).toBe("Opening Range Breakout");

      // Execute trade linked to this playbook
      TradeService.createTrade(userAId, {
        accountId: accountAId,
        symbol: "ES",
        assetClass: "FUTURES",
        direction: "LONG",
        status: "CLOSED",
        entryTime: "2026-10-12T14:30:00Z",
        entryPrice: 5800.0,
        exitPrice: 5815.0,
        quantity: 1, // +$750
        playbookId: pb.id,
        playbookName: pb.name,
      });

      const enrichedPlaybooks = PlaybookService.getPlaybooks(userAId);
      expect(enrichedPlaybooks.length).toBe(1);
      expect(enrichedPlaybooks[0].tradeCount).toBe(1);
      expect(enrichedPlaybooks[0].winRate).toBe(100);
      expect(enrichedPlaybooks[0].totalNetPnl).toBe(750);
    });

    it("updates and deletes playbooks", () => {
      const pb = PlaybookService.createPlaybook(userAId, {
        name: "Mean Reversion",
        setupRules: "RSI extreme at key S/R",
        entryCriteria: "Rejection wick",
        exitCriteria: "Midpoint",
        riskRules: "1R max",
      });

      const updated = PlaybookService.updatePlaybook(userAId, pb.id, {
        name: "Mean Reversion (Advanced)",
      });
      expect(updated.name).toBe("Mean Reversion (Advanced)");

      const deleted = PlaybookService.deletePlaybook(userAId, pb.id);
      expect(deleted).toBe(true);

      const list = PlaybookService.getPlaybooks(userAId);
      expect(list.length).toBe(0);
    });
  });

  describe("Discipline Tracker & Trading Rules", () => {
    it("creates rules and records daily adherence checklists", () => {
      const rule1 = DisciplineService.createRule(userAId, {
        title: "Never move stop loss against myself",
        description: "Capital protection rule",
        ruleType: "PER_TRADE",
      });

      const rule2 = DisciplineService.createRule(userAId, {
        title: "Max 3 trades per day",
        description: "Prevents overtrading",
        ruleType: "DAILY",
      });

      expect(rule1.id).toBeDefined();
      expect(rule2.id).toBeDefined();

      const date = "2026-10-12";

      // Mark rule 1 adhered, rule 2 violated
      DisciplineService.setLog(userAId, {
        ruleId: rule1.id,
        logDate: date,
        isAdhered: true,
      });

      DisciplineService.setLog(userAId, {
        ruleId: rule2.id,
        logDate: date,
        isAdhered: false,
      });

      const checklist = DisciplineService.getDailyChecklist(userAId, date);
      expect(checklist.length).toBe(2);

      const item1 = checklist.find((c) => c.rule.id === rule1.id);
      expect(item1?.isAdhered).toBe(true);

      const item2 = checklist.find((c) => c.rule.id === rule2.id);
      expect(item2?.isAdhered).toBe(false);

      // Score calculation: 1 out of 2 = 50%
      const score = DisciplineService.getDisciplineScore(userAId);
      expect(score.totalLogs).toBe(2);
      expect(score.adheredCount).toBe(1);
      expect(score.violatedCount).toBe(1);
      expect(score.overallScore).toBe(50);
      expect(score.currentStreakDays).toBe(0); // broken due to violation
    });

    it("calculates discipline streaks accurately for consecutive compliant days", () => {
      const rule = DisciplineService.createRule(userAId, {
        title: "Log every trade immediately",
        ruleType: "DAILY",
      });

      // 3 consecutive 100% compliant days
      DisciplineService.setLog(userAId, { ruleId: rule.id, logDate: "2026-10-10", isAdhered: true });
      DisciplineService.setLog(userAId, { ruleId: rule.id, logDate: "2026-10-11", isAdhered: true });
      DisciplineService.setLog(userAId, { ruleId: rule.id, logDate: "2026-10-12", isAdhered: true });

      const score = DisciplineService.getDisciplineScore(userAId);
      expect(score.overallScore).toBe(100);
      expect(score.currentStreakDays).toBe(3);
    });
  });

  describe("Multi-Tenant Isolation", () => {
    it("ensures User B cannot view User A's journals, playbooks, or discipline rules", () => {
      JournalService.upsertEntry(userAId, { entryDate: "2026-10-12", title: "User A Secret Diary" });
      PlaybookService.createPlaybook(userAId, { name: "User A Secret Strategy", setupRules: "Rules" });
      DisciplineService.createRule(userAId, { title: "User A Rule", ruleType: "DAILY" });

      expect(JournalService.getUserEntries(userBId).length).toBe(0);
      expect(PlaybookService.getPlaybooks(userBId).length).toBe(0);
      expect(DisciplineService.getUserRules(userBId).length).toBe(0);
    });
  });
});
