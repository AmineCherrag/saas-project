import fs from "fs";
import path from "path";
import { DisciplineRule, DisciplineLog } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const RULES_FILE = path.join(DATA_DIR, "discipline_rules.json");
const LOGS_FILE = path.join(DATA_DIR, "discipline_logs.json");

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RULES_FILE)) {
    fs.writeFileSync(RULES_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readRules(): DisciplineRule[] {
  ensureFiles();
  try {
    const raw = fs.readFileSync(RULES_FILE, "utf-8");
    return JSON.parse(raw) as DisciplineRule[];
  } catch {
    return [];
  }
}

function writeRules(rules: DisciplineRule[]) {
  ensureFiles();
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), "utf-8");
}

function readLogs(): DisciplineLog[] {
  ensureFiles();
  try {
    const raw = fs.readFileSync(LOGS_FILE, "utf-8");
    return JSON.parse(raw) as DisciplineLog[];
  } catch {
    return [];
  }
}

function writeLogs(logs: DisciplineLog[]) {
  ensureFiles();
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
}

export class DisciplineStore {
  // Rules CRUD
  static getRulesByUserId(userId: string): DisciplineRule[] {
    const rules = readRules();
    return rules.filter((r) => r.userId === userId);
  }

  static findRuleById(id: string): DisciplineRule | null {
    const rules = readRules();
    return rules.find((r) => r.id === id) || null;
  }

  static createRule(rule: DisciplineRule): DisciplineRule {
    const rules = readRules();
    rules.push(rule);
    writeRules(rules);
    return rule;
  }

  static updateRule(id: string, updates: Partial<DisciplineRule>): DisciplineRule | null {
    const rules = readRules();
    const index = rules.findIndex((r) => r.id === id);
    if (index === -1) return null;

    rules[index] = { ...rules[index], ...updates };
    writeRules(rules);
    return rules[index];
  }

  static deleteRule(id: string): boolean {
    const rules = readRules();
    const filtered = rules.filter((r) => r.id !== id);
    if (filtered.length === rules.length) return false;
    writeRules(filtered);
    return true;
  }

  // Logs CRUD
  static getLogsByUserId(userId: string): DisciplineLog[] {
    const logs = readLogs();
    return logs.filter((l) => l.userId === userId);
  }

  static getLogsByDate(userId: string, date: string): DisciplineLog[] {
    const logs = readLogs();
    return logs.filter((l) => l.userId === userId && l.logDate === date);
  }

  static setLog(log: DisciplineLog): DisciplineLog {
    const logs = readLogs();
    const existingIndex = logs.findIndex(
      (l) => l.userId === log.userId && l.ruleId === log.ruleId && l.logDate === log.logDate
    );

    if (existingIndex !== -1) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }

    writeLogs(logs);
    return log;
  }

  static clear(): void {
    writeRules([]);
    writeLogs([]);
  }
}
