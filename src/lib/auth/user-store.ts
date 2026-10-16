import { StoredUser, UserSession } from "./types";
import { prisma, isPostgresDatabase } from "../db/prisma";

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export const DEFAULT_ADMIN_USER: StoredUser = {
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

// In-memory store (RAM only, zero disk writes, safe for Vercel read-only filesystem)
const inMemoryUsers = new Map<string, StoredUser>([
  [DEFAULT_ADMIN_USER.id, { ...DEFAULT_ADMIN_USER }],
]);
const inMemorySessions = new Map<string, UserSession>();
const inMemoryAuditLogs: AuditLogEntry[] = [];

// Helper to convert Prisma User model to StoredUser
function mapDbUserToStoredUser(dbUser: any): StoredUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    passwordHash: dbUser.passwordHash || "",
    name: dbUser.name,
    avatarUrl: dbUser.avatarUrl || undefined,
    role: dbUser.role as "USER" | "ADMIN",
    baseCurrency: dbUser.baseCurrency || "USD",
    timezone: dbUser.timezone || "America/New_York",
    emailVerified: dbUser.emailVerified ?? false,
    verificationToken: dbUser.verificationToken || undefined,
    resetToken: dbUser.resetToken || undefined,
    resetTokenExpiry: dbUser.resetTokenExpiry
      ? new Date(dbUser.resetTokenExpiry).toISOString()
      : undefined,
    twoFactorEnabled: dbUser.twoFactorEnabled ?? false,
    twoFactorSecret: undefined,
    isSuspended: dbUser.isSuspended ?? false,
    createdAt: dbUser.createdAt instanceof Date ? dbUser.createdAt.toISOString() : String(dbUser.createdAt),
    updatedAt: dbUser.updatedAt instanceof Date ? dbUser.updatedAt.toISOString() : String(dbUser.updatedAt),
  };
}

export class UserStore {
  // Users CRUD
  static getAllUsers(): StoredUser[] {
    if (isPostgresDatabase()) {
      prisma.user.findMany()
        .then((users) => {
          for (const u of users) {
            inMemoryUsers.set(u.id, mapDbUserToStoredUser(u));
          }
        })
        .catch(() => {});
    }
    return Array.from(inMemoryUsers.values());
  }

  static async getAllUsersAsync(): Promise<StoredUser[]> {
    if (isPostgresDatabase()) {
      try {
        const users = await prisma.user.findMany();
        const mapped = users.map(mapDbUserToStoredUser);
        for (const u of mapped) inMemoryUsers.set(u.id, u);
        return mapped;
      } catch (e) {
        console.warn("[UserStore.getAllUsersAsync] PostgreSQL fallback to in-memory:", e);
      }
    }
    return Array.from(inMemoryUsers.values());
  }

  static findById(id: string): StoredUser | null {
    if (isPostgresDatabase()) {
      prisma.user.findUnique({ where: { id } })
        .then((u) => {
          if (u) inMemoryUsers.set(u.id, mapDbUserToStoredUser(u));
        })
        .catch(() => {});
    }
    return inMemoryUsers.get(id) || null;
  }

  static async findByIdAsync(id: string): Promise<StoredUser | null> {
    if (isPostgresDatabase()) {
      try {
        const u = await prisma.user.findUnique({ where: { id } });
        if (u) {
          const mapped = mapDbUserToStoredUser(u);
          inMemoryUsers.set(mapped.id, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[UserStore.findByIdAsync] PostgreSQL fallback to in-memory:", e);
      }
    }
    return inMemoryUsers.get(id) || null;
  }

  static findByEmail(email: string): StoredUser | null {
    const normalized = email.toLowerCase().trim();
    if (isPostgresDatabase()) {
      prisma.user.findUnique({ where: { email: normalized } })
        .then((u) => {
          if (u) inMemoryUsers.set(u.id, mapDbUserToStoredUser(u));
        })
        .catch(() => {});
    }
    for (const u of inMemoryUsers.values()) {
      if (u.email.toLowerCase() === normalized) return u;
    }
    return null;
  }

  static async findByEmailAsync(email: string): Promise<StoredUser | null> {
    const normalized = email.toLowerCase().trim();
    if (isPostgresDatabase()) {
      try {
        const u = await prisma.user.findUnique({ where: { email: normalized } });
        if (u) {
          const mapped = mapDbUserToStoredUser(u);
          inMemoryUsers.set(mapped.id, mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("[UserStore.findByEmailAsync] PostgreSQL fallback to in-memory:", e);
      }
    }
    for (const u of inMemoryUsers.values()) {
      if (u.email.toLowerCase() === normalized) return u;
    }
    return null;
  }

  static findByVerificationToken(token: string): StoredUser | null {
    for (const u of inMemoryUsers.values()) {
      if (u.verificationToken === token) return u;
    }
    return null;
  }

  static findByResetToken(token: string): StoredUser | null {
    for (const u of inMemoryUsers.values()) {
      if (u.resetToken === token) return u;
    }
    return null;
  }

  static create(user: StoredUser): StoredUser {
    inMemoryUsers.set(user.id, { ...user });

    if (isPostgresDatabase()) {
      prisma.user.upsert({
        where: { email: user.email.toLowerCase() },
        create: {
          id: user.id,
          email: user.email.toLowerCase(),
          passwordHash: user.passwordHash,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role === "ADMIN" ? "ADMIN" : "USER",
          baseCurrency: user.baseCurrency,
          timezone: user.timezone,
          emailVerified: user.emailVerified,
          verificationToken: user.verificationToken,
          resetToken: user.resetToken,
          resetTokenExpiry: user.resetTokenExpiry ? new Date(user.resetTokenExpiry) : null,
          twoFactorEnabled: user.twoFactorEnabled,
          isSuspended: user.isSuspended,
        },
        update: {
          passwordHash: user.passwordHash,
          name: user.name,
          role: user.role === "ADMIN" ? "ADMIN" : "USER",
          baseCurrency: user.baseCurrency,
          timezone: user.timezone,
          emailVerified: user.emailVerified,
          verificationToken: user.verificationToken,
          resetToken: user.resetToken,
          resetTokenExpiry: user.resetTokenExpiry ? new Date(user.resetTokenExpiry) : null,
          isSuspended: user.isSuspended,
        },
      }).catch((e) => {
        console.warn("[UserStore.create] PostgreSQL write error:", e);
      });
    }

    return user;
  }

  static update(id: string, updates: Partial<StoredUser>): StoredUser | null {
    const existing = inMemoryUsers.get(id);
    if (!existing) return null;

    const updated: StoredUser = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    inMemoryUsers.set(id, updated);

    if (isPostgresDatabase()) {
      prisma.user.update({
        where: { id },
        data: {
          name: updates.name,
          passwordHash: updates.passwordHash,
          role: updates.role ? (updates.role === "ADMIN" ? "ADMIN" : "USER") : undefined,
          baseCurrency: updates.baseCurrency,
          timezone: updates.timezone,
          emailVerified: updates.emailVerified,
          verificationToken: updates.verificationToken,
          resetToken: updates.resetToken,
          resetTokenExpiry: updates.resetTokenExpiry ? new Date(updates.resetTokenExpiry) : undefined,
          twoFactorEnabled: updates.twoFactorEnabled,
          isSuspended: updates.isSuspended,
        },
      }).catch((e) => {
        console.warn("[UserStore.update] PostgreSQL update error:", e);
      });
    }

    return updated;
  }

  static delete(id: string): boolean {
    const existed = inMemoryUsers.delete(id);
    if (!existed) return false;

    // Clean up sessions
    for (const [sId, s] of inMemorySessions.entries()) {
      if (s.userId === id) inMemorySessions.delete(sId);
    }

    if (isPostgresDatabase()) {
      prisma.session.deleteMany({ where: { userId: id } })
        .then(() => prisma.user.delete({ where: { id } }))
        .catch((e) => {
          console.warn("[UserStore.delete] PostgreSQL delete error:", e);
        });
    }

    return true;
  }

  // Sessions
  static getAllSessions(): UserSession[] {
    return Array.from(inMemorySessions.values());
  }

  static saveSession(session: UserSession): UserSession {
    inMemorySessions.set(session.sessionId, { ...session });

    if (isPostgresDatabase()) {
      prisma.session.upsert({
        where: { sessionId: session.sessionId },
        create: {
          sessionId: session.sessionId,
          userId: session.userId,
          email: session.email,
          name: session.name,
          role: session.role === "ADMIN" ? "ADMIN" : "USER",
          expiresAt: new Date(session.expiresAt),
        },
        update: {
          expiresAt: new Date(session.expiresAt),
        },
      }).catch((e) => {
        console.warn("[UserStore.saveSession] PostgreSQL session save error:", e);
      });
    }

    return session;
  }

  static findSession(sessionId: string): UserSession | null {
    const session = inMemorySessions.get(sessionId);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  static async findSessionAsync(sessionId: string): Promise<UserSession | null> {
    const session = inMemorySessions.get(sessionId);
    if (session) {
      if (new Date(session.expiresAt) < new Date()) {
        this.deleteSession(sessionId);
        return null;
      }
      return session;
    }

    if (isPostgresDatabase()) {
      try {
        const dbSession = await prisma.session.findUnique({ where: { sessionId } });
        if (dbSession) {
          if (new Date(dbSession.expiresAt) < new Date()) {
            await prisma.session.delete({ where: { sessionId } }).catch(() => {});
            return null;
          }
          const s: UserSession = {
            sessionId: dbSession.sessionId,
            userId: dbSession.userId,
            email: dbSession.email,
            name: dbSession.name,
            role: dbSession.role as "USER" | "ADMIN",
            expiresAt: dbSession.expiresAt.toISOString(),
          };
          inMemorySessions.set(s.sessionId, s);
          return s;
        }
      } catch (e) {
        console.warn("[UserStore.findSessionAsync] PostgreSQL session query fallback:", e);
      }
    }

    return null;
  }

  static deleteSession(sessionId: string): void {
    inMemorySessions.delete(sessionId);

    if (isPostgresDatabase()) {
      prisma.session.deleteMany({ where: { sessionId } }).catch(() => {});
    }
  }

  // Audit Logging
  static logAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const newLog: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    inMemoryAuditLogs.push(newLog);

    if (isPostgresDatabase()) {
      prisma.auditLog.create({
        data: {
          id: newLog.id,
          userId: newLog.userId || null,
          action: newLog.action,
          targetResource: (newLog.details as any)?.targetResource || "SYSTEM",
          ipAddress: newLog.ipAddress || null,
          detailsJson: (newLog.details as any) || undefined,
          createdAt: new Date(newLog.timestamp),
        },
      }).catch((e) => {
        console.warn("[UserStore.logAudit] PostgreSQL audit log error:", e);
      });
    }

    return newLog;
  }

  static getAuditLogs(userId?: string): AuditLogEntry[] {
    if (userId) {
      return inMemoryAuditLogs.filter((l) => l.userId === userId);
    }
    return inMemoryAuditLogs;
  }

  static clear(): void {
    inMemoryUsers.clear();
    inMemoryUsers.set(DEFAULT_ADMIN_USER.id, { ...DEFAULT_ADMIN_USER });
    inMemorySessions.clear();
    inMemoryAuditLogs.length = 0;
  }
}
