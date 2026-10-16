import { JournalEntry } from "@/types";
import { prisma, isPostgresDatabase } from "../db/prisma";

const inMemoryJournals = new Map<string, JournalEntry>();

function mapDbJournalToJournalEntry(dbJ: any): JournalEntry {
  const dateStr = dbJ.entryDate instanceof Date
    ? dbJ.entryDate.toISOString().split("T")[0]
    : String(dbJ.entryDate).split("T")[0];

  const content = dbJ.contentJson && typeof dbJ.contentJson === "object" ? dbJ.contentJson : {};

  return {
    id: dbJ.id,
    userId: dbJ.userId,
    entryDate: dateStr,
    title: dbJ.title,
    preSessionPlan: dbJ.preSessionPlan || undefined,
    postSessionReview: dbJ.postSessionReview || undefined,
    emotionalScore: dbJ.emotionalScore ?? undefined,
    marketSentiment: dbJ.marketSentiment || undefined,
    tags: Array.isArray(content.tags) ? content.tags : undefined,
    createdAt: dbJ.createdAt instanceof Date ? dbJ.createdAt.toISOString() : String(dbJ.createdAt),
    updatedAt: dbJ.updatedAt instanceof Date ? dbJ.updatedAt.toISOString() : String(dbJ.updatedAt),
  };
}

export class JournalStore {
  static getAll(): JournalEntry[] {
    if (isPostgresDatabase()) {
      prisma.journalEntry.findMany()
        .then((entries) => {
          for (const j of entries) inMemoryJournals.set(j.id, mapDbJournalToJournalEntry(j));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryJournals.values());
  }

  static async getAllAsync(): Promise<JournalEntry[]> {
    if (isPostgresDatabase()) {
      try {
        const entries = await prisma.journalEntry.findMany({ orderBy: { entryDate: "desc" } });
        const mapped = entries.map(mapDbJournalToJournalEntry);
        for (const j of mapped) inMemoryJournals.set(j.id, j);
        return mapped;
      } catch (e) {
        console.warn("[JournalStore.getAllAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return Array.from(inMemoryJournals.values());
  }

  static findByUserId(userId: string): JournalEntry[] {
    if (isPostgresDatabase()) {
      prisma.journalEntry.findMany({ where: { userId }, orderBy: { entryDate: "desc" } })
        .then((entries) => {
          for (const j of entries) inMemoryJournals.set(j.id, mapDbJournalToJournalEntry(j));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryJournals.values())
      .filter((j) => j.userId === userId)
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }

  static async findByUserIdAsync(userId: string): Promise<JournalEntry[]> {
    if (isPostgresDatabase()) {
      try {
        const entries = await prisma.journalEntry.findMany({
          where: { userId },
          orderBy: { entryDate: "desc" },
        });
        const mapped = entries.map(mapDbJournalToJournalEntry);
        for (const j of mapped) inMemoryJournals.set(j.id, j);
        return mapped;
      } catch (e) {
        console.warn("[JournalStore.findByUserIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return this.findByUserId(userId);
  }

  static findById(id: string): JournalEntry | null {
    if (isPostgresDatabase()) {
      prisma.journalEntry.findUnique({ where: { id } })
        .then((j) => {
          if (j) inMemoryJournals.set(j.id, mapDbJournalToJournalEntry(j));
        })
        .catch(() => {});
    }
    return inMemoryJournals.get(id) || null;
  }

  static async findByIdAsync(id: string): Promise<JournalEntry | null> {
    if (isPostgresDatabase()) {
      try {
        const j = await prisma.journalEntry.findUnique({ where: { id } });
        if (j) {
          const mapped = mapDbJournalToJournalEntry(j);
          inMemoryJournals.set(mapped.id, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[JournalStore.findByIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return inMemoryJournals.get(id) || null;
  }

  static findByDate(userId: string, entryDate: string): JournalEntry | null {
    const formatted = entryDate.split("T")[0];
    for (const j of inMemoryJournals.values()) {
      if (j.userId === userId && j.entryDate === formatted) return j;
    }
    return null;
  }

  static async findByDateAsync(userId: string, entryDate: string): Promise<JournalEntry | null> {
    const formatted = entryDate.split("T")[0];
    if (isPostgresDatabase()) {
      try {
        const j = await prisma.journalEntry.findFirst({
          where: { userId, entryDate: new Date(formatted) },
        });
        if (j) {
          const mapped = mapDbJournalToJournalEntry(j);
          inMemoryJournals.set(mapped.id, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[JournalStore.findByDateAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return this.findByDate(userId, entryDate);
  }

  static create(entry: JournalEntry): JournalEntry {
    inMemoryJournals.set(entry.id, { ...entry });

    if (isPostgresDatabase()) {
      const dateObj = new Date(entry.entryDate);
      prisma.journalEntry.upsert({
        where: { id: entry.id },
        create: {
          id: entry.id,
          userId: entry.userId,
          entryDate: dateObj,
          title: entry.title,
          preSessionPlan: entry.preSessionPlan || null,
          postSessionReview: entry.postSessionReview || null,
          emotionalScore: entry.emotionalScore ?? null,
          marketSentiment: entry.marketSentiment || null,
          contentJson: entry.tags ? { tags: entry.tags } : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        },
        update: {
          title: entry.title,
          preSessionPlan: entry.preSessionPlan || null,
          postSessionReview: entry.postSessionReview || null,
          emotionalScore: entry.emotionalScore ?? null,
          marketSentiment: entry.marketSentiment || null,
          contentJson: entry.tags ? { tags: entry.tags } : undefined,
          updatedAt: new Date(),
        },
      }).catch((e) => {
        console.warn("[JournalStore.create] PostgreSQL write error:", e);
      });
    }

    return entry;
  }

  static update(id: string, updates: Partial<JournalEntry>): JournalEntry | null {
    const existing = inMemoryJournals.get(id);
    if (!existing) return null;

    const updated: JournalEntry = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    inMemoryJournals.set(id, updated);

    if (isPostgresDatabase()) {
      prisma.journalEntry.update({
        where: { id },
        data: {
          title: updates.title,
          preSessionPlan: updates.preSessionPlan,
          postSessionReview: updates.postSessionReview,
          emotionalScore: updates.emotionalScore,
          marketSentiment: updates.marketSentiment,
          contentJson: updates.tags ? { tags: updates.tags } : undefined,
          updatedAt: new Date(),
        },
      }).catch((e) => {
        console.warn("[JournalStore.update] PostgreSQL update error:", e);
      });
    }

    return updated;
  }

  static delete(id: string): boolean {
    const existed = inMemoryJournals.delete(id);
    if (!existed) return false;

    if (isPostgresDatabase()) {
      prisma.journalEntry.delete({ where: { id } }).catch((e) => {
        console.warn("[JournalStore.delete] PostgreSQL delete error:", e);
      });
    }

    return true;
  }

  static clear(): void {
    inMemoryJournals.clear();
  }
}
