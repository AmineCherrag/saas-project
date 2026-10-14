import { DisciplineRule, DisciplineLog } from "@/types";
import { DisciplineStore } from "./discipline-store";
import { UserStore } from "../auth/user-store";

export interface CreateRuleInput {
  title: string;
  description?: string;
  ruleType: "DAILY" | "WEEKLY" | "PER_TRADE";
  targetValue?: string;
}

export interface SetLogInput {
  ruleId: string;
  logDate: string; // YYYY-MM-DD
  isAdhered: boolean;
  notes?: string;
}

export interface RuleChecklistItem {
  rule: DisciplineRule;
  isAdhered: boolean;
  notes?: string;
}

export interface DisciplineScoreData {
  overallScore: number; // percentage (0 - 100)
  currentStreakDays: number;
  totalLogs: number;
  adheredCount: number;
  violatedCount: number;
  activeRulesCount: number;
}

export class DisciplineService {
  /**
   * Create new trading rule
   */
  static createRule(userId: string, input: CreateRuleInput): DisciplineRule {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error("Discipline rule title is required.");
    }

    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRule: DisciplineRule = {
      id: ruleId,
      userId,
      title: input.title.trim(),
      description: input.description?.trim(),
      ruleType: input.ruleType || "DAILY",
      targetValue: input.targetValue?.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    DisciplineStore.createRule(newRule);

    UserStore.logAudit({
      userId,
      action: "DISCIPLINE_RULE_CREATED",
      details: { ruleId, title: newRule.title },
    });

    return newRule;
  }

  /**
   * Get all rules for a user
   */
  static getUserRules(userId: string): DisciplineRule[] {
    return DisciplineStore.getRulesByUserId(userId);
  }

  /**
   * Delete a trading rule
   */
  static deleteRule(userId: string, id: string): boolean {
    const rule = DisciplineStore.findRuleById(id);
    if (!rule || rule.userId !== userId) {
      throw new Error("Discipline rule not found or access denied.");
    }

    const success = DisciplineStore.deleteRule(id);
    if (success) {
      UserStore.logAudit({
        userId,
        action: "DISCIPLINE_RULE_DELETED",
        details: { ruleId: id },
      });
    }

    return success;
  }

  /**
   * Record or toggle adherence for a rule on a date
   */
  static setLog(userId: string, input: SetLogInput): DisciplineLog {
    const rule = DisciplineStore.findRuleById(input.ruleId);
    if (!rule || rule.userId !== userId) {
      throw new Error("Discipline rule not found or access denied.");
    }

    const logId = `log_${input.logDate}_${rule.id}`;
    const log: DisciplineLog = {
      id: logId,
      userId,
      ruleId: input.ruleId,
      logDate: input.logDate,
      isAdhered: input.isAdhered,
      notes: input.notes,
    };

    return DisciplineStore.setLog(log);
  }

  /**
   * Get daily rule checklist with checked state for a given date
   */
  static getDailyChecklist(userId: string, date: string): RuleChecklistItem[] {
    const rules = this.getUserRules(userId).filter((r) => r.isActive);
    const logs = DisciplineStore.getLogsByDate(userId, date);

    return rules.map((rule) => {
      const match = logs.find((l) => l.ruleId === rule.id);
      return {
        rule,
        isAdhered: match ? match.isAdhered : false,
        notes: match?.notes,
      };
    });
  }

  /**
   * Compute discipline adherence score and streak
   */
  static getDisciplineScore(userId: string): DisciplineScoreData {
    const rules = this.getUserRules(userId).filter((r) => r.isActive);
    const logs = DisciplineStore.getLogsByUserId(userId);

    const totalLogs = logs.length;
    const adheredCount = logs.filter((l) => l.isAdhered).length;
    const violatedCount = totalLogs - adheredCount;

    const overallScore = totalLogs > 0 ? Math.round((adheredCount / totalLogs) * 1000) / 10 : 100;

    // Calculate current streak of 100% adherence days going backwards from today
    const dateMap = new Map<string, { total: number; adhered: number }>();
    for (const log of logs) {
      const existing = dateMap.get(log.logDate) || { total: 0, adhered: 0 };
      existing.total++;
      if (log.isAdhered) existing.adhered++;
      dateMap.set(log.logDate, existing);
    }

    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));
    let currentStreakDays = 0;

    for (const d of sortedDates) {
      const stats = dateMap.get(d)!;
      if (stats.adhered === stats.total && stats.total > 0) {
        currentStreakDays++;
      } else {
        break; // Streak broken
      }
    }

    return {
      overallScore,
      currentStreakDays,
      totalLogs,
      adheredCount,
      violatedCount,
      activeRulesCount: rules.length,
    };
  }
}
