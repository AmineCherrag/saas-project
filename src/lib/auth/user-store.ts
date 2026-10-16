import fs from "fs";
import path from "path";
import { StoredUser, UserSession } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const AUDIT_LOGS_FILE = path.join(DATA_DIR, "audit_logs.json");

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

const DEFAULT_ADMIN_USER: StoredUser = {
  id: "usr_admin_master",
  email: "admin@tradepulse.io",
  passwordHash: "$2a$12$xDd/FR4FsXFqJBVs4txeXu/9AYnmlq.TUjU4hfgeYH.oIJqNvaiHq", // Admin123!
  name: "System Administrator",
  role: "ADMIN",
  baseCurrency: "USD",
  timezone: "America/New_York",
  emailVerified: true,
  twoFactorEnabled: false,
  isSuspended: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// Ensure data directory exists
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([DEFAULT_ADMIN_USER], null, 2), "utf-8");
  } else {
    try {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const users = JSON.parse(raw) as StoredUser[];
      if (!users.some((u) => u.role === "ADMIN")) {
        users.push(DEFAULT_ADMIN_USER);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
      }
    } catch {
      // ignore
    }
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(AUDIT_LOGS_FILE)) {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readJsonFile<T>(filePath: string): T[] {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeJsonFile<T>(filePath: string, data: T[]) {
  ensureDataFiles();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export class UserStore {
  // Users CRUD
  static getAllUsers(): StoredUser[] {
    return readJsonFile<StoredUser>(USERS_FILE);
  }

  static findById(id: string): StoredUser | null {
    const users = this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  }

  static findByEmail(email: string): StoredUser | null {
    const users = this.getAllUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static findByVerificationToken(token: string): StoredUser | null {
    const users = this.getAllUsers();
    return users.find((u) => u.verificationToken === token) || null;
  }

  static findByResetToken(token: string): StoredUser | null {
    const users = this.getAllUsers();
    return users.find((u) => u.resetToken === token) || null;
  }

  static create(user: StoredUser): StoredUser {
    const users = this.getAllUsers();
    users.push(user);
    writeJsonFile(USERS_FILE, users);
    return user;
  }

  static update(id: string, updates: Partial<StoredUser>): StoredUser | null {
    const users = this.getAllUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeJsonFile(USERS_FILE, users);
    return users[index];
  }

  static delete(id: string): boolean {
    const users = this.getAllUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (filtered.length === users.length) return false;

    writeJsonFile(USERS_FILE, filtered);

    // Cascading session cleanup
    const sessions = this.getAllSessions();
    const remainingSessions = sessions.filter((s) => s.userId !== id);
    writeJsonFile(SESSIONS_FILE, remainingSessions);

    return true;
  }

  // Sessions
  static getAllSessions(): UserSession[] {
    return readJsonFile<UserSession>(SESSIONS_FILE);
  }

  static saveSession(session: UserSession): UserSession {
    const sessions = this.getAllSessions();
    sessions.push(session);
    writeJsonFile(SESSIONS_FILE, sessions);
    return session;
  }

  static findSession(sessionId: string): UserSession | null {
    const sessions = this.getAllSessions();
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  static deleteSession(sessionId: string): void {
    const sessions = this.getAllSessions();
    const filtered = sessions.filter((s) => s.sessionId !== sessionId);
    writeJsonFile(SESSIONS_FILE, filtered);
  }

  // Audit Logging
  static logAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const logs = readJsonFile<AuditLogEntry>(AUDIT_LOGS_FILE);
    const newLog: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    logs.push(newLog);
    writeJsonFile(AUDIT_LOGS_FILE, logs);
    return newLog;
  }

  static getAuditLogs(userId?: string): AuditLogEntry[] {
    const logs = readJsonFile<AuditLogEntry>(AUDIT_LOGS_FILE);
    if (userId) {
      return logs.filter((l) => l.userId === userId);
    }
    return logs;
  }
}
