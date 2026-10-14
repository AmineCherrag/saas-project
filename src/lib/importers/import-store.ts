import fs from "fs";
import path from "path";
import { ImportBatch } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const IMPORTS_FILE = path.join(DATA_DIR, "imports.json");
const FINGERPRINTS_FILE = path.join(DATA_DIR, "import_fingerprints.json");

export interface FingerprintRecord {
  fingerprint: string;
  batchId: string;
  tradeId: string;
  userId: string;
  createdAt: string;
}

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(IMPORTS_FILE)) {
    fs.writeFileSync(IMPORTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(FINGERPRINTS_FILE)) {
    fs.writeFileSync(FINGERPRINTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readBatches(): ImportBatch[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(IMPORTS_FILE, "utf-8");
    return JSON.parse(raw) as ImportBatch[];
  } catch {
    return [];
  }
}

function writeBatches(batches: ImportBatch[]) {
  ensureDataFiles();
  fs.writeFileSync(IMPORTS_FILE, JSON.stringify(batches, null, 2), "utf-8");
}

function readFingerprints(): FingerprintRecord[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(FINGERPRINTS_FILE, "utf-8");
    return JSON.parse(raw) as FingerprintRecord[];
  } catch {
    return [];
  }
}

function writeFingerprints(records: FingerprintRecord[]) {
  ensureDataFiles();
  fs.writeFileSync(FINGERPRINTS_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export class ImportStore {
  static getAll(): ImportBatch[] {
    return readBatches();
  }

  static findById(id: string): ImportBatch | null {
    const batches = readBatches();
    return batches.find((b) => b.id === id) || null;
  }

  static findByUserId(userId: string): ImportBatch[] {
    const batches = readBatches();
    return batches
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static createBatch(batch: ImportBatch): ImportBatch {
    const batches = readBatches();
    batches.push(batch);
    writeBatches(batches);
    return batch;
  }

  static updateBatch(id: string, updates: Partial<ImportBatch>): ImportBatch | null {
    const batches = readBatches();
    const index = batches.findIndex((b) => b.id === id);
    if (index === -1) return null;

    batches[index] = { ...batches[index], ...updates };
    writeBatches(batches);
    return batches[index];
  }

  static recordFingerprints(records: FingerprintRecord[]): void {
    const existing = readFingerprints();
    existing.push(...records);
    writeFingerprints(existing);
  }

  static getFingerprintsForUser(userId: string): Set<string> {
    const records = readFingerprints();
    const userRecords = records.filter((r) => r.userId === userId);
    return new Set(userRecords.map((r) => r.fingerprint));
  }

  static hasFingerprint(userId: string, fingerprint: string): boolean {
    const set = this.getFingerprintsForUser(userId);
    return set.has(fingerprint);
  }

  static removeFingerprintsForBatch(batchId: string): void {
    const existing = readFingerprints();
    const remaining = existing.filter((r) => r.batchId !== batchId);
    writeFingerprints(remaining);
  }

  static clear(): void {
    writeBatches([]);
    writeFingerprints([]);
  }
}
