import { PrismaClient } from "@prisma/client";

/**
 * TradePulse Database Client
 * Configured for PostgreSQL database via DATABASE_URL.
 * SQLite and file-based fallbacks are completely removed for production safety.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function isPostgresDatabase(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && (url.startsWith("postgres://") || url.startsWith("postgresql://")));
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

