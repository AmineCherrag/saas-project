import fs from "fs";
import path from "path";
import { Playbook } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PLAYBOOKS_FILE = path.join(DATA_DIR, "playbooks.json");

function ensurePlaybooksFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PLAYBOOKS_FILE)) {
    fs.writeFileSync(PLAYBOOKS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readPlaybooks(): Playbook[] {
  ensurePlaybooksFile();
  try {
    const raw = fs.readFileSync(PLAYBOOKS_FILE, "utf-8");
    return JSON.parse(raw) as Playbook[];
  } catch {
    return [];
  }
}

function writePlaybooks(playbooks: Playbook[]) {
  ensurePlaybooksFile();
  fs.writeFileSync(PLAYBOOKS_FILE, JSON.stringify(playbooks, null, 2), "utf-8");
}

export class PlaybookStore {
  static getAll(): Playbook[] {
    return readPlaybooks();
  }

  static findByUserId(userId: string): Playbook[] {
    const playbooks = readPlaybooks();
    return playbooks
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static findById(id: string): Playbook | null {
    const playbooks = readPlaybooks();
    return playbooks.find((p) => p.id === id) || null;
  }

  static create(playbook: Playbook): Playbook {
    const playbooks = readPlaybooks();
    playbooks.push(playbook);
    writePlaybooks(playbooks);
    return playbook;
  }

  static update(id: string, updates: Partial<Playbook>): Playbook | null {
    const playbooks = readPlaybooks();
    const index = playbooks.findIndex((p) => p.id === id);
    if (index === -1) return null;

    playbooks[index] = { ...playbooks[index], ...updates };
    writePlaybooks(playbooks);
    return playbooks[index];
  }

  static delete(id: string): boolean {
    const playbooks = readPlaybooks();
    const filtered = playbooks.filter((p) => p.id !== id);
    if (filtered.length === playbooks.length) return false;
    writePlaybooks(filtered);
    return true;
  }

  static clear(): void {
    writePlaybooks([]);
  }
}
