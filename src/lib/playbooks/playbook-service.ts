import { Playbook, Trade } from "@/types";
import { PlaybookStore } from "./playbook-store";
import { TradeStore } from "../trades/trade-store";
import { UserStore } from "../auth/user-store";

export interface CreatePlaybookInput {
  name: string;
  description?: string;
  setupRules: string;
  entryCriteria: string;
  exitCriteria: string;
  riskRules: string;
  preferredSession?: string;
}

export interface EnrichedPlaybook extends Playbook {
  totalNetPnl: number;
  avgRMultiple?: number;
}

export class PlaybookService {
  /**
   * Create a new playbook strategy
   */
  static createPlaybook(userId: string, input: CreatePlaybookInput): Playbook {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error("Playbook strategy name is required.");
    }
    if (!input.setupRules || input.setupRules.trim().length === 0) {
      throw new Error("Setup rules are required.");
    }

    const playbookId = `pb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newPlaybook: Playbook = {
      id: playbookId,
      userId,
      name: input.name.trim(),
      description: input.description?.trim(),
      setupRules: input.setupRules.trim(),
      entryCriteria: input.entryCriteria?.trim() || "Defined in setup rules",
      exitCriteria: input.exitCriteria?.trim() || "Defined in risk rules",
      riskRules: input.riskRules?.trim() || "Standard risk parameters",
      preferredSession: input.preferredSession?.trim(),
      winRate: 0,
      tradeCount: 0,
      createdAt: new Date().toISOString(),
    };

    PlaybookStore.create(newPlaybook);

    UserStore.logAudit({
      userId,
      action: "PLAYBOOK_CREATED",
      details: { playbookId, name: newPlaybook.name },
    });

    return newPlaybook;
  }

  /**
   * Get all playbooks for user with live rolled-up trade statistics
   */
  static getPlaybooks(userId: string): EnrichedPlaybook[] {
    const playbooks = PlaybookStore.findByUserId(userId);
    const userTrades = TradeStore.findByUserId(userId).filter((t) => t.status === "CLOSED");

    return playbooks.map((pb) => {
      // Find trades matching this playbook (by ID or exact name)
      const linkedTrades = userTrades.filter(
        (t) => t.playbookId === pb.id || t.playbookName?.toLowerCase() === pb.name.toLowerCase()
      );

      const count = linkedTrades.length;
      const wins = linkedTrades.filter((t) => t.netPnl > 0).length;
      const winRate = count > 0 ? Math.round((wins / count) * 1000) / 10 : 0;
      const totalNetPnl = linkedTrades.reduce((sum, t) => sum + t.netPnl, 0);

      const tradesWithR = linkedTrades.filter((t) => t.rMultiple !== undefined && t.rMultiple !== null);
      const avgR = tradesWithR.length > 0
        ? Math.round((tradesWithR.reduce((sum, t) => sum + t.rMultiple!, 0) / tradesWithR.length) * 100) / 100
        : undefined;

      return {
        ...pb,
        tradeCount: count,
        winRate,
        totalNetPnl: Math.round(totalNetPnl * 100) / 100,
        avgRMultiple: avgR,
      };
    });
  }

  /**
   * Get single playbook by ID
   */
  static getPlaybookById(userId: string, id: string): EnrichedPlaybook {
    const playbooks = this.getPlaybooks(userId);
    const found = playbooks.find((p) => p.id === id);
    if (!found) {
      throw new Error("Playbook strategy not found or access denied.");
    }
    return found;
  }

  /**
   * Update playbook strategy
   */
  static updatePlaybook(userId: string, id: string, updates: Partial<CreatePlaybookInput>): Playbook {
    const existing = PlaybookStore.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Playbook strategy not found or access denied.");
    }

    const updated = PlaybookStore.update(id, updates);
    if (!updated) {
      throw new Error("Failed to update playbook strategy.");
    }

    UserStore.logAudit({
      userId,
      action: "PLAYBOOK_UPDATED",
      details: { playbookId: id },
    });

    return updated;
  }

  /**
   * Delete playbook strategy
   */
  static deletePlaybook(userId: string, id: string): boolean {
    const existing = PlaybookStore.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Playbook strategy not found or access denied.");
    }

    const success = PlaybookStore.delete(id);
    if (success) {
      UserStore.logAudit({
        userId,
        action: "PLAYBOOK_DELETED",
        details: { playbookId: id },
      });
    }

    return success;
  }
}
