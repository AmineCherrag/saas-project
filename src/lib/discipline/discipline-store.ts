import { DisciplineRule, DisciplineLog } from "@/types";
import { prisma, isPostgresDatabase } from "../db/prisma";

const inMemoryRules = new Map<string, DisciplineRule>();
const inMemoryLogs = new Map<string, DisciplineLog>();

function mapDbRuleToDisciplineRule(dbR: any): DisciplineRule {
  return {
    id: dbR.id,
    userId: dbR.userId,
    title: dbR.title,
    description: dbR.description || undefined,
    ruleType: dbR.ruleType as any,
    targetValue: dbR.targetValue || undefined,
    isActive: dbR.isActive,
    createdAt: dbR.createdAt instanceof Date ? dbR.createdAt.toISOString() : String(dbR.createdAt),
  };
}

export class DisciplineStore {
  // Rules CRUD
  static getRulesByUserId(userId: string): DisciplineRule[] {
    if (isPostgresDatabase()) {
      prisma.disciplineRule.findMany({ where: { userId } })
        .then((rules) => {
          for (const r of rules) inMemoryRules.set(r.id, mapDbRuleToDisciplineRule(r));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryRules.values()).filter((r) => r.userId === userId);
  }

  static async getRulesByUserIdAsync(userId: string): Promise<DisciplineRule[]> {
    if (isPostgresDatabase()) {
      try {
        const rules = await prisma.disciplineRule.findMany({ where: { userId } });
        const mapped = rules.map(mapDbRuleToDisciplineRule);
        for (const r of mapped) inMemoryRules.set(r.id, r);
        return mapped;
      } catch (e) {
        console.warn("[DisciplineStore.getRulesByUserIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return this.getRulesByUserId(userId);
  }

  static findRuleById(id: string): DisciplineRule | null {
    if (isPostgresDatabase()) {
      prisma.disciplineRule.findUnique({ where: { id } })
        .then((r) => {
          if (r) inMemoryRules.set(r.id, mapDbRuleToDisciplineRule(r));
        })
        .catch(() => {});
    }
    return inMemoryRules.get(id) || null;
  }

  static createRule(rule: DisciplineRule): DisciplineRule {
    inMemoryRules.set(rule.id, { ...rule });

    if (isPostgresDatabase()) {
      prisma.disciplineRule.upsert({
        where: { id: rule.id },
        create: {
          id: rule.id,
          userId: rule.userId,
          title: rule.title,
          description: rule.description || null,
          ruleType: rule.ruleType,
          targetValue: rule.targetValue || null,
          isActive: rule.isActive,
          createdAt: new Date(rule.createdAt),
        },
        update: {
          title: rule.title,
          description: rule.description || null,
          ruleType: rule.ruleType,
          targetValue: rule.targetValue || null,
          isActive: rule.isActive,
        },
      }).catch((e) => {
        console.warn("[DisciplineStore.createRule] PostgreSQL write error:", e);
      });
    }

    return rule;
  }

  static updateRule(id: string, updates: Partial<DisciplineRule>): DisciplineRule | null {
    const existing = inMemoryRules.get(id);
    if (!existing) return null;

    const updated: DisciplineRule = {
      ...existing,
      ...updates,
    };
    inMemoryRules.set(id, updated);

    if (isPostgresDatabase()) {
      prisma.disciplineRule.update({
        where: { id },
        data: {
          title: updates.title,
          description: updates.description,
          ruleType: updates.ruleType,
          targetValue: updates.targetValue,
          isActive: updates.isActive,
        },
      }).catch((e) => {
        console.warn("[DisciplineStore.updateRule] PostgreSQL update error:", e);
      });
    }

    return updated;
  }

  static deleteRule(id: string): boolean {
    const existed = inMemoryRules.delete(id);
    if (!existed) return false;

    if (isPostgresDatabase()) {
      prisma.disciplineRule.delete({ where: { id } }).catch((e) => {
        console.warn("[DisciplineStore.deleteRule] PostgreSQL delete error:", e);
      });
    }

    return true;
  }

  // Logs CRUD
  static getLogsByUserId(userId: string): DisciplineLog[] {
    return Array.from(inMemoryLogs.values()).filter((l) => l.userId === userId);
  }

  static getLogsByDate(userId: string, date: string): DisciplineLog[] {
    const formatted = date.split("T")[0];
    return Array.from(inMemoryLogs.values()).filter(
      (l) => l.userId === userId && l.logDate === formatted
    );
  }

  static setLog(log: DisciplineLog): DisciplineLog {
    const key = `${log.userId}_${log.ruleId}_${log.logDate}`;
    inMemoryLogs.set(key, { ...log });

    if (isPostgresDatabase()) {
      const logDateObj = new Date(log.logDate);
      prisma.disciplineLog.upsert({
        where: {
          userId_ruleId_logDate: {
            userId: log.userId,
            ruleId: log.ruleId,
            logDate: logDateObj,
          },
        },
        create: {
          id: `dlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: log.userId,
          ruleId: log.ruleId,
          logDate: logDateObj,
          isAdhered: log.isAdhered,
          notes: log.notes || null,
        },
        update: {
          isAdhered: log.isAdhered,
          notes: log.notes || null,
        },
      }).catch((e) => {
        console.warn("[DisciplineStore.setLog] PostgreSQL write error:", e);
      });
    }

    return log;
  }

  static clear(): void {
    inMemoryRules.clear();
    inMemoryLogs.clear();
  }
}
