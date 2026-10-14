# System Architecture: TradePulse SaaS
**Multi-Tenant Cloud Architecture & System Design**

---

## 1. Architectural Principles

1. **Strict Multi-Tenant Isolation**: Every database record tied to user data is scoped with `user_id` (the tenant identifier). Query builders enforce ownership checks at the data access layer.
2. **Deterministic Mathematical Correctness**: Trade calculation logic is isolated in a pure, headless, side-effect-free calculation engine with 100% automated test coverage.
3. **Decoupled Service Layer**: Business logic resides in dedicated services (`TradeService`, `AnalyticsService`, `SubscriptionService`) rather than being tightly coupled to HTTP handlers or UI components.
4. **Provider-Agnostic Abstractions**: Payment gateways (Stripe, Lemon Squeezy) and Object Storage (S3, Cloudflare R2) use adapter patterns to avoid vendor lock-in.
5. **High Performance & Sub-Second Latency**: Optimized indexing on composite trade attributes `(user_id, account_id, entry_time)`, server-side rendering for marketing pages, and fast client-side query caching with optimistic UI updates.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT TIER                                      |
|                                                                                   |
|  [ Public Marketing Pages (SSR) ]          [ Authenticated Dashboard (SPA/PWA) ]  |
|  - Landing, Pricing, Features, FAQ         - Real-time Journal, Charts, Analytics |
|  - Next.js 15 App Router / Vanilla CSS     - Lightweight Charts, Canvas Replay    |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / TLS 1.3
                                           v
+-----------------------------------------------------------------------------------+
|                         GATEWAY & APPLICATION TIER                                |
|                                                                                   |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  |  NextAuth / JWT     |   |  Zod Input          |   |  Rate Limiting &        |  |
|  |  Auth Middleware    |-->|  Validation Layer   |-->|  Role Guard (RBAC)      |  |
|  +---------------------+   +---------------------+   +-------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                              SERVICE LAYER                                  |  |
|  |  - AuthService         - TradeCalculationService     - AnalyticsEngine      |  |
|  |  - CsvImportService    - PlaybookService             - DisciplineService    |  |
|  |  - BillingService      - WebhookHandler              - AdminService         |  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
             +-----------------------------+-----------------------------+
             |                             |                             |
             v                             v                             v
+-------------------------+   +-------------------------+   +-----------------------+
|      DATABASE TIER      |   |      STORAGE TIER       |   |   EXTERNAL SERVICES   |
|                         |   |                         |   |                       |
|  PostgreSQL 16+         |   |  S3 / Cloudflare R2     |   |  Stripe / LemonSq     |
|  Prisma / Drizzle ORM   |   |  Presigned Upload URLs  |   |  Webhooks & Billing   |
|  Multi-Tenant Scoping   |   |  Encrypted Screenshots  |   |  Transactional Email  |
|  B-Tree & Composite Idx |   |  Attachment Storage     |   |  (Resend / Postmark)  |
+-------------------------+   +-------------------------+   +-----------------------+
```

---

## 3. Tier-by-Tier System Details

### 3.1 Frontend Tier
- **Framework**: Next.js 15 (React 19, TypeScript 5.5+).
- **Styling Architecture**: Pure Vanilla CSS and CSS Modules utilizing an institutional design token system (CSS Variables). Zero runtime CSS-in-JS overhead; maximum flexibility, custom dark/light theme switching, and lightweight bundles.
- **Financial Charting**:
  - **Candlestick Replay & Execution Overlays**: `@tradingview/lightweight-charts` (canvas-based 60 FPS rendering of price action with trade markers).
  - **Performance Curves & Distributions**: Chart.js / Recharts for equity curves, daily P&L histograms, drawdown charts, and win/loss donuts.
- **Client State & Data Fetching**: TanStack Query (React Query) for declarative caching, background refetching, and pagination; Zustand for ephemeral UI states (active account filter, sidebar toggle, date range).

### 3.2 Backend & API Tier
- **Runtime**: Node.js 24 LTS.
- **API Architecture**: Next.js App Router Route Handlers (`/api/v1/...`) with strict HTTP status codes, structured JSON error envelopes, and idempotency key support.
- **Validation**: Zod schemas for all inbound payloads (`POST`, `PUT`, `PATCH`, `GET` query parameters).
- **Service Layer Pattern**:
  - `TradeCalculationEngine`: Pure functions for computing Net P&L, Gross P&L, R-Multiples, Drawdowns, and Sharpe/Sortino ratios.
  - `CsvImportPipeline`: Stream parser utilizing `papaparse` with auto-column detection, duplicate fingerprint hashing, and transaction-wrapped batch insertions.
  - `BillingManager`: Dynamic entitlement verification prior to executing protected operations (e.g., verifying account creation does not exceed subscription plan limits).

### 3.3 Database Tier
- **Database Engine**: PostgreSQL 16+ (Production target: Supabase, Neon, or AWS RDS).
- **Data Access**: Prisma ORM with connection pooling via PgBouncer.
- **Multi-Tenancy Enforcement**:
  - Every application query explicitly binds `WHERE user_id = :sessionUserId`.
  - Composite primary/foreign keys enforce data integrity across accounts, trades, executions, and journal entries.
- **Performance Indexes**:
  - `CREATE INDEX idx_trades_user_account_date ON trades (user_id, account_id, entry_time DESC);`
  - `CREATE INDEX idx_executions_trade_id ON executions (trade_id);`
  - `CREATE INDEX idx_journal_user_date ON journal_entries (user_id, entry_date);`

### 3.4 Authentication & Security Tier
- **Authentication**: NextAuth.js (Auth.js) v5 with credentials provider (bcrypt password hashing with work factor 12) and Google OAuth provider.
- **Session Tokens**: JWT stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies with 30-day rolling expiration.
- **Role-Based Access Control (RBAC)**:
  - `USER`: Access to tenant-owned resources only.
  - `ADMIN`: Access to tenant-owned resources plus global administration endpoints (`/api/v1/admin/*`).
- **CSRF & Rate Limiting**: Token-based CSRF defense on mutative requests and in-memory/Redis sliding-window rate limiters on sensitive endpoints (`/api/auth/*`, `/api/v1/billing/*`).

### 3.5 Storage & Asset Pipeline
- **Object Storage**: S3-compatible storage (Cloudflare R2 or AWS S3).
- **Upload Security**:
  - Client requests a presigned PUT URL from `/api/v1/upload/presign`.
  - Server validates user session, file MIME type (`image/png`, `image/jpeg`, `image/webp`), and file size (max 5 MB).
  - Direct upload from client to storage bucket eliminates backend server bandwidth bottlenecks.
  - Public asset delivery via signed URLs or CDN with cache headers.

### 3.6 Payment & Webhook Architecture
- **Provider Abstraction**:
  ```typescript
  export interface PaymentGateway {
    createCheckoutSession(userId: string, planId: string, interval: 'month' | 'year'): Promise<string>;
    createCustomerPortalSession(customerId: string): Promise<string>;
    handleWebhookEvent(payload: Buffer, signature: string): Promise<WebhookResult>;
  }
  ```
- **Webhook Reliability**:
  - HMAC SHA-256 signature verification on every incoming webhook.
  - Idempotency table (`webhook_events`) storing event IDs to reject duplicate deliveries.
  - Atomic database transactions updating user subscription state (`status`, `plan_id`, `current_period_end`).

---

## 4. Key Data Flows

### 4.1 Trade Import Flow
1. User uploads broker CSV file.
2. Frontend parses header row and proposes column mapping based on broker templates (ThinkorSwim, Tradovate, MT5, etc.).
3. User confirms mapping; frontend streams file to `/api/v1/trades/import`.
4. Backend parses rows, applies symbol normalization, and generates a SHA-256 hash for each execution.
5. Duplicate check against existing executions for that account.
6. `TradeCalculationEngine` groups executions into trade positions (FIFO / exact match).
7. Database transaction commits trades, executions, and updates account balance in a single atomic operation.
8. Real-time response returns imported count, skipped duplicates count, and error summary.

### 4.2 Analytics Aggregation Flow
1. User selects date range (`Last 30 Days`, `Year to Date`, `Custom Range`) and account filter.
2. Frontend calls `/api/v1/analytics/overview`.
3. Backend fetches filtered trades from PostgreSQL with pre-aggregated SQL functions for cumulative metrics.
4. `AnalyticsEngine` computes mathematical distributions (Hourly win rate, R-multiple spread, max drawdown curve, win/loss streak metrics).
5. Cached response returned with ETag headers for client-side memoization.
