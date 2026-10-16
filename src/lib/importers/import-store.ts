import { ImportBatch } from "@/types";
import { prisma, isPostgresDatabase } from "../db/prisma";

export interface FingerprintRecord {
  fingerprint: string;
  batchId: string;
  tradeId: string;
  userId: string;
  createdAt: string;
}

const inMemoryBatches = new Map<string, ImportBatch>();
const inMemoryFingerprints: FingerprintRecord[] = [];

function mapDbBatchToImportBatch(dbB: any): ImportBatch {
  return {
    id: dbB.id,
    userId: dbB.userId,
    accountId: dbB.accountId,
    brokerPreset: dbB.brokerPreset,
    fileName: dbB.fileName,
    totalRows: dbB.totalRows,
    importedCount: dbB.importedCount,
    duplicateCount: dbB.duplicateCount,
    failedCount: dbB.failedCount,
    tradeIds: dbB.tradeIds,
    status: dbB.status as any,
    createdAt: dbB.createdAt instanceof Date ? dbB.createdAt.toISOString() : String(dbB.createdAt),
  };
}

export class ImportStore {
  static getAll(): ImportBatch[] {
    if (isPostgresDatabase()) {
      prisma.importBatch.findMany()
        .then((batches) => {
          for (const b of batches) inMemoryBatches.set(b.id, mapDbBatchToImportBatch(b));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryBatches.values());
  }

  static findById(id: string): ImportBatch | null {
    if (isPostgresDatabase()) {
      prisma.importBatch.findUnique({ where: { id } })
        .then((b) => {
          if (b) inMemoryBatches.set(b.id, mapDbBatchToImportBatch(b));
        })
        .catch(() => {});
    }
    return inMemoryBatches.get(id) || null;
  }

  static async findByIdAsync(id: string): Promise<ImportBatch | null> {
    if (isPostgresDatabase()) {
      try {
        const b = await prisma.importBatch.findUnique({ where: { id } });
        if (b) {
          const mapped = mapDbBatchToImportBatch(b);
          inMemoryBatches.set(mapped.id, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[ImportStore.findByIdAsync] PostgreSQL fallback to memory:", e);
      }
    }
    return inMemoryBatches.get(id) || null;
  }

  static findByUserId(userId: string): ImportBatch[] {
    if (isPostgresDatabase()) {
      prisma.importBatch.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })
        .then((batches) => {
          for (const b of batches) inMemoryBatches.set(b.id, mapDbBatchToImportBatch(b));
        })
        .catch(() => {});
    }
    return Array.from(inMemoryBatches.values())
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static createBatch(batch: ImportBatch): ImportBatch {
    inMemoryBatches.set(batch.id, { ...batch });

    if (isPostgresDatabase()) {
      prisma.importBatch.upsert({
        where: { id: batch.id },
        create: {
          id: batch.id,
          userId: batch.userId,
          accountId: batch.accountId,
          brokerPreset: batch.brokerPreset,
          fileName: batch.fileName,
          totalRows: batch.totalRows,
          importedCount: batch.importedCount,
          duplicateCount: batch.duplicateCount,
          failedCount: batch.failedCount,
          tradeIds: batch.tradeIds,
          status: batch.status,
          createdAt: new Date(batch.createdAt),
        },
        update: {
          importedCount: batch.importedCount,
          duplicateCount: batch.duplicateCount,
          failedCount: batch.failedCount,
          tradeIds: batch.tradeIds,
          status: batch.status,
        },
      }).catch((e) => {
        console.warn("[ImportStore.createBatch] PostgreSQL write error:", e);
      });
    }

    return batch;
  }

  static updateBatch(id: string, updates: Partial<ImportBatch>): ImportBatch | null {
    const existing = inMemoryBatches.get(id);
    if (!existing) return null;

    const updated: ImportBatch = {
      ...existing,
      ...updates,
    };
    inMemoryBatches.set(id, updated);

    if (isPostgresDatabase()) {
      prisma.importBatch.update({
        where: { id },
        data: {
          status: updates.status,
          importedCount: updates.importedCount,
          duplicateCount: updates.duplicateCount,
          failedCount: updates.failedCount,
          tradeIds: updates.tradeIds,
        },
      }).catch((e) => {
        console.warn("[ImportStore.updateBatch] PostgreSQL update error:", e);
      });
    }

    return updated;
  }

  static recordFingerprints(records: FingerprintRecord[]): void {
    inMemoryFingerprints.push(...records);

    if (isPostgresDatabase()) {
      prisma.importFingerprint.createMany({
        data: records.map((r) => ({
          fingerprint: r.fingerprint,
          batchId: r.batchId,
          tradeId: r.tradeId,
          userId: r.userId,
          createdAt: new Date(r.createdAt),
        })),
        skipDuplicates: true,
      }).catch((e) => {
        console.warn("[ImportStore.recordFingerprints] PostgreSQL write error:", e);
      });
    }
  }

  static getFingerprintsForUser(userId: string): Set<string> {
    const userRecords = inMemoryFingerprints.filter((r) => r.userId === userId);
    return new Set(userRecords.map((r) => r.fingerprint));
  }

  static hasFingerprint(userId: string, fingerprint: string): boolean {
    const set = this.getFingerprintsForUser(userId);
    return set.has(fingerprint);
  }

  static removeFingerprintsForBatch(batchId: string): void {
    for (let i = inMemoryFingerprints.length - 1; i >= 0; i--) {
      if (inMemoryFingerprints[i].batchId === batchId) {
        inMemoryFingerprints.splice(i, 1);
      }
    }

    if (isPostgresDatabase()) {
      prisma.importFingerprint.deleteMany({ where: { batchId } }).catch((e) => {
        console.warn("[ImportStore.removeFingerprintsForBatch] PostgreSQL delete error:", e);
      });
    }
  }

  static clear(): void {
    inMemoryBatches.clear();
    inMemoryFingerprints.length = 0;
  }
}
