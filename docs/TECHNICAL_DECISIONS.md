# Technical Decisions & Architectural Rationale: TradePulse SaaS
**Technology Stack Selection, Trade-Off Analyses & Architecture Records**

---

## 1. Executive Technology Stack Summary

| Layer | Chosen Technology | Primary Alternatives Considered | Decisive Rationale |
|---|---|---|---|
| **Full-Stack Framework** | **Next.js 15 (App Router, TS, React 19)** | Remix / Fastify + Vite SPA / Go + React | Unified full-stack repository; native SSR for marketing SEO; server actions & API routes; flawless TypeScript typing from DB to UI. |
| **Styling & Design System** | **Vanilla CSS + CSS Modules + Design Tokens** | TailwindCSS / Styled Components / Chakra UI | Zero runtime CSS footprint; complete design flexibility; custom financial dark/light themes; complies strictly with core web design guidelines. |
| **Database & ORM** | **PostgreSQL 16+ with Prisma ORM** | MongoDB / MySQL / Drizzle ORM | ACID compliance for financial ledger balances; strict relational schemas and foreign keys; type-safe migrations; decimal precision for money. |
| **Authentication** | **NextAuth.js (Auth.js v5) + JWT Cookies** | Supabase Auth / Clerk / Custom Express JWT | Open-source; zero external vendor lock-in; secure HttpOnly rolling sessions; native Next.js middleware integration; easily extensible. |
| **Financial Charting** | **@tradingview/lightweight-charts** | D3.js / Recharts / Highcharts | Canvas-based 60fps rendering; industry-standard candlestick visualization; native support for trade execution markers and price scales. |
| **Analytical Charting** | **Chart.js & Recharts** | ApexCharts / Victory | Lightweight bundle; crisp canvas rendering for equity curves, daily P&L histograms, and win/loss donuts. |
| **Data Parsing & CSV** | **PapaParse + Custom Normalizer** | Fast-CSV / SheetJS | Robust client & server streaming; browser-side preview capability before upload; forgiving delimiter handling. |
| **Payment Gateway** | **Provider-Agnostic Adapter (Stripe + Lemon Squeezy)** | Stripe-only / Paddle-only | Decouples business logic from payment vendor; enables merchant flexibility (Stripe for direct processing, Lemon Squeezy for MoR tax automation). |
| **Object Storage** | **S3-Compatible (Cloudflare R2 / AWS S3)** | Local Disk / Base64 DB Storage | High availability; presigned direct client uploads; zero bandwidth load on application servers; zero egress fees on Cloudflare R2. |
| **Testing Suite** | **Vitest + Playwright** | Jest + Cypress | Vitest shares Vite/esbuild speed and ESM compatibility; Playwright offers robust multi-browser E2E test automation. |

---

## 2. Deep-Dive Architecture Decision Records (ADRs)

### ADR-01: Full-Stack Next.js 15 vs. Decoupled Backend (Go/Fastify) + Frontend SPA
- **Context**: We need to deliver a commercial SaaS comprising a public marketing website (requiring high SEO, fast FCP, and meta tags) and a complex authenticated dashboard (analytics, trade log, charts).
- **Decision**: Adopt **Next.js 15 (App Router)** with TypeScript as the unified full-stack platform.
- **Consequences**:
  - *Positive*: Eliminates boilerplate CORS configuration; shared TypeScript interfaces between frontend and backend services; instant SSR/SSG for marketing pages (`/`, `/pricing`, `/features`) with zero server overhead; co-located API endpoints.
  - *Mitigation*: Complex long-running data imports are handled with chunked streams to avoid serverless execution timeout constraints.

### ADR-02: Pure Vanilla CSS Design Tokens vs. Tailwind CSS
- **Context**: The platform requires a bespoke, institutional, high-contrast trading visual identity with dark/light mode toggling, glassmorphism, and responsive tables.
- **Decision**: Implement a **pure Vanilla CSS architecture using CSS Modules and CSS Custom Properties (Design Tokens)**.
- **Consequences**:
  - *Positive*: Zero bundle bloat; no build-time purge issues; direct control over transitions, financial micro-interactions, and high-density tabular typography.
  - *Standard*: Follows strict design guidelines without relying on generic utility classes.

### ADR-03: PostgreSQL Relational Model with Explicit Decimal Precision
- **Context**: Financial calculations (PnL, commissions, contract multipliers, account balances) suffer catastrophic rounding errors if stored as standard IEEE-754 64-bit floating point numbers (`FLOAT` or `DOUBLE`).
- **Decision**: Store all monetary, price, fee, and risk values as **`Decimal(16, 4)`** or **`Decimal(16, 2)`** in PostgreSQL, mapped via Prisma's `Decimal` type.
- **Consequences**:
  - *Positive*: Exact mathematical precision; matches accounting standards; protects against rounding drift over tens of thousands of trades.

### ADR-04: Multi-Tenant Data Isolation Strategy (Shared DB, Scoped Queries)
- **Context**: TradePulse is a commercial SaaS. User trade data is strictly confidential. We must guarantee that customer data is isolated while keeping infrastructure cost-effective.
- **Decision**: Implement **Row-Level Tenant Scoping via Application Service Interceptors** where every query binds the tenant's `userId`.
- **Consequences**:
  - *Positive*: Cost-effective connection pooling; simple automated database migrations; instant backup/restore routines.
  - *Security Verification*: Automated cross-tenant penetration test suite in CI to verify that attempting to read or modify another tenant's trade returns 404/403.

### ADR-05: Abstracted Payment Gateway Adapter Pattern
- **Context**: SaaS founders operate across varied geographies. In some jurisdictions, Stripe is available; in others, Merchant-of-Record (MoR) providers like Lemon Squeezy or Paddle are mandatory to handle EU VAT and sales taxes.
- **Decision**: Design a decoupled `PaymentService` interface with swappable implementations (`StripePaymentAdapter` and `LemonSqueezyPaymentAdapter`).
- **Consequences**:
  - *Positive*: Switching or offering alternative payment rails requires zero modification to user subscription tables or entitlement logic.
