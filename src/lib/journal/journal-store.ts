import fs from "fs";
import path from "path";
import { JournalEntry } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const JOURNALS_FILE = path.join(DATA_DIR, "journals.json");

function ensureJournalsFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(JOURNALS_FILE)) {
    fs.writeFileSync(JOURNALS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readJournals(): JournalEntry[] {
  ensureJournalsFile();
  try {
    const raw = fs.readFileSync(JOURNALS_FILE, "utf-8");
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

function writeJournals(entries: JournalEntry[]) {
  ensureJournalsFile();
  fs.writeFileSync(JOURNALS_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export class JournalStore {
  static getAll(): JournalEntry[] {
    return readJournals();
  }

  static findByUserId(userId: string): JournalEntry[] {
    const entries = readJournals();
    return entries
      .filter((j) => j.userId === userId)
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }

  static findById(id: string): JournalEntry | null {
    const entries = readJournals();
    return entries.find((j) => j.id === id) || null;
  }

  static findByDate(userId: string, entryDate: string): JournalEntry | null {
    const entries = readJournals();
    return entries.find((j) => j.userId === userId && j.entryDate === entryDate) || null;
  }

  static create(entry: JournalEntry): JournalEntry {
    const entries = readJournals();
    entries.push(entry);
    writeJournals(entries);
    return entry;
  }

  static update(id: string, updates: Partial<JournalEntry>): JournalEntry | null {
    const entries = readJournals();
    const index = entries.findIndex((j) => j.id === id);
    if (index === -1) return null;

    entries[index] = {
      ...entries[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeJournals(entries);
    return entries[index];
  }

  static delete(id: string): boolean {
    const entries = readJournals();
    const filtered = entries.filter((j) => j.id !== id);
    if (filtered.length === entries.length) return false;
    writeJournals(filtered);
    return true;
  }

  static clear(): void {
    writeJournals([]);
  }
}
