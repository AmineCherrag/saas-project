import { Playbook } from "@/types";
import { prisma, isPostgresDatabase } from "../db/prisma";

const inMemoryPlaybooks = new Map<string, Playbook>();

function mapDbPlaybookToPlaybook(dbP: any): Playbook {
  return {
    id: dbP.id,
    userId: dbP.userId,
    name: dbP.name,
    description: dbP.description || undefined,
    setupRules: dbP.setupRules,
    entryCriteria: dbP.entryCriteria,
    exitCriteria: dbP.exitCriteria,
    riskRules: dbP.riskRules,
    preferredSession: dbP.preferredSession || undefined,
    createdAt: dbP.createdAt instanceof Date ? dbP.createdAt.toISOString() : String(dbP.createdAt),
  };
}

export class PlaybookStore {
  static getAll(): Playbook[] {
    if (isPostgresDatabase()) {
      prisma.playbook.findMany()
        .then((playbooks) => {
          for (const p of playbooks) inMemoryPlaybooks.set(p.id, mapDbPlaybookToPlaybook(p));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryPlaybooks.values());
  }

  static async getAllAsync(): Promise<Playbook[]> {
    if (isPostgresDatabase()) {
      try {
        const playbooks = await prisma.playbook.findMany({ orderBy: { createdAt: "desc" } });
        const mapped = playbooks.map(mapDbPlaybookToPlaybook);
        for (const p of mapped) inMemoryPlaybooks.set(p.id, p);
        return mapped;
      } catch (e) {
        console.warn("[PlaybookStore.getAllAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return Array.from(inMemoryPlaybooks.values());
  }

  static findByUserId(userId: string): Playbook[] {
    if (isPostgresDatabase()) {
      prisma.playbook.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
        .then((playbooks) => {
          for (const p of playbooks) inMemoryPlaybooks.set(p.id, mapDbPlaybookToPlaybook(p));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryPlaybooks.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async findByUserIdAsync(userId: string): Promise<Playbook[]> {
    if (isPostgresDatabase()) {
      try {
        const playbooks = await prisma.playbook.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        const mapped = playbooks.map(mapDbPlaybookToPlaybook);
        for (const p of mapped) inMemoryPlaybooks.set(p.id, p);
        return mapped;
      } catch (e) {
        console.warn("[PlaybookStore.findByUserIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return this.findByUserId(userId);
  }

  static findById(id: string): Playbook | null {
    if (isPostgresDatabase()) {
      prisma.playbook.findUnique({ where: { id } })
        .then((p) => {
          if (p) inMemoryPlaybooks.set(p.id, mapDbPlaybookToPlaybook(p));
        })
        .catch(() => {});
    }
    return inMemoryPlaybooks.get(id) || null;
  }

  static async findByIdAsync(id: string): Promise<Playbook | null> {
    if (isPostgresDatabase()) {
      try {
        const p = await prisma.playbook.findUnique({ where: { id } });
        if (p) {
          const mapped = mapDbPlaybookToPlaybook(p);
          inMemoryPlaybooks.set(mapped.id, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[PlaybookStore.findByIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return inMemoryPlaybooks.get(id) || null;
  }

  static create(playbook: Playbook): Playbook {
    inMemoryPlaybooks.set(playbook.id, { ...playbook });

    if (isPostgresDatabase()) {
      prisma.playbook.upsert({
        where: { id: playbook.id },
        create: {
          id: playbook.id,
          userId: playbook.userId,
          name: playbook.name,
          description: playbook.description || null,
          setupRules: playbook.setupRules,
          entryCriteria: playbook.entryCriteria,
          exitCriteria: playbook.exitCriteria,
          riskRules: playbook.riskRules,
          preferredSession: playbook.preferredSession || null,
          createdAt: new Date(playbook.createdAt),
        },
        update: {
          name: playbook.name,
          description: playbook.description || null,
          setupRules: playbook.setupRules,
          entryCriteria: playbook.entryCriteria,
          exitCriteria: playbook.exitCriteria,
          riskRules: playbook.riskRules,
          preferredSession: playbook.preferredSession || null,
        },
      }).catch((e) => {
        console.warn("[PlaybookStore.create] PostgreSQL write error:", e);
      });
    }

    return playbook;
  }

  static update(id: string, updates: Partial<Playbook>): Playbook | null {
    const existing = inMemoryPlaybooks.get(id);
    if (!existing) return null;

    const updated: Playbook = {
      ...existing,
      ...updates,
    };
    inMemoryPlaybooks.set(id, updated);

    if (isPostgresDatabase()) {
      prisma.playbook.update({
        where: { id },
        data: {
          name: updates.name,
          description: updates.description,
          setupRules: updates.setupRules,
          entryCriteria: updates.entryCriteria,
          exitCriteria: updates.exitCriteria,
          riskRules: updates.riskRules,
          preferredSession: updates.preferredSession,
        },
      }).catch((e) => {
        console.warn("[PlaybookStore.update] PostgreSQL update error:", e);
      });
    }

    return updated;
  }

  static delete(id: string): boolean {
    const existed = inMemoryPlaybooks.delete(id);
    if (!existed) return false;

    if (isPostgresDatabase()) {
      prisma.playbook.delete({ where: { id } }).catch((e) => {
        console.warn("[PlaybookStore.delete] PostgreSQL delete error:", e);
      });
    }

    return true;
  }

  static clear(): void {
    inMemoryPlaybooks.clear();
  }
}
