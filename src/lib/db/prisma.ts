/**
 * TradePulse Database Client
 * Configurable for PostgreSQL (production) with fallback support for development/offline testing.
 */

// Safe database connection URL derivation
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || "file:./data/tradepulse.db";
}

export function isPostgresDatabase(): boolean {
  const url = getDatabaseUrl();
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}
