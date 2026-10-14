# Testing Strategy & Quality Assurance Plan: TradePulse SaaS
**Unit, Integration, Financial Formula & End-to-End Test Plan**

---

## 1. Testing Philosophy & Quality Standards

TradePulse is a commercial financial application. Inaccurate trade calculations, silent rounding errors, or broken data imports directly destroy trader trust. Quality assurance is mandatory across three rigorous testing tiers:
1. **Unit Testing**: 100% test coverage for pure mathematical engines (`TradeCalculationEngine`, `AnalyticsEngine`, `DateUtils`, `CsvParsers`).
2. **Integration Testing**: API route testing with ephemeral test databases verifying CRUD operations, auth session guards, tenant data isolation, and webhook processing.
3. **End-to-End (E2E) Testing**: Automated browser testing (Playwright) simulating realistic trader flows from registration to CSV import, dashboard analytics, and billing checkout.

---

## 2. Test Architecture & Tooling

| Tier | Test Runner | Scope | Execution Target |
|---|---|---|---|
| **Unit Tests** | Vitest / Jest | Financial calculations, CSV parsers, formatters, validation schemas | Local development & CI (`npm run test:unit`) |
| **Integration Tests** | Vitest + Prisma Test Environment | API handlers, service layer, database transactions, auth guards | Local & CI (`npm run test:integration`) |
| **E2E Tests** | Playwright | Full browser interactions, responsive layouts, client charting, checkout | Headless CI (`npm run test:e2e`) |

---

## 3. Financial Calculation Test Matrix

The calculation engine must be verified with deterministic test suites covering all asset classes, execution mechanics, and edge cases:

### 3.1 Long & Short Position Calculations
- **Long Single Fill**:
  - Entry: 100 shares @ $150.00, Exit: 100 shares @ $155.00, Fees: $2.00.
  - Expected: Gross P&L = +$500.00, Net P&L = +$498.00.
- **Short Single Fill**:
  - Entry: 100 shares @ $200.00, Exit: 100 shares @ $190.00, Fees: $2.00.
  - Expected: Gross P&L = +$1,000.00, Net P&L = +$998.00.
- **Losing Short**:
  - Entry: 50 shares @ $100.00, Exit: 50 shares @ $105.00, Fees: $1.50.
  - Expected: Gross P&L = -$250.00, Net P&L = -$251.50.

### 3.2 Scale-In & Scale-Out (Partial Executions)
- **Scale-In Entry**:
  - Entry 1: 10 contracts @ 5000.00.
  - Entry 2: 10 contracts @ 5020.00.
  - Average Entry Price = 5010.00.
- **Partial Exits**:
  - Exit 1: 10 contracts @ 5040.00 (+$300/contract gross).
  - Exit 2: 10 contracts @ 5010.00 (Break-even).
  - Verification: Weighted average exit price, remaining open size, and realized P&L calculation.

### 3.3 Contract Multipliers & Asset Classes
- **Futures (E-mini S&P / ES)**: Multiplier = 50.00.
  - Buy 2 ES @ 5000.00, Sell 2 ES @ 5010.00 (+10 points).
  - Gross P&L: $10 \times 2 \times 50 = +\$1,000.00$.
- **Futures (Micro Nasdaq / MNQ)**: Multiplier = 2.00.
  - Buy 5 MNQ @ 18000.00, Sell 5 MNQ @ 18050.00 (+50 points).
  - Gross P&L: $50 \times 5 \times 2 = +\$500.00$.
- **Equity Options**: Multiplier = 100.00.
  - Buy 3 Calls @ $2.50 ($250/contract), Sell 3 Calls @ $4.00 ($400/contract).
  - Gross P&L: $(\$4.00 - \$2.50) \times 3 \times 100 = +\$450.00$.
- **Forex Pips & Multi-Currency**: Point/lot calculation validation for EUR/USD, GBP/USD, USD/JPY.

### 3.4 Risk & R-Multiple Formulas
- **R-Multiple Verification**:
  - Long: Entry = $100.00, Stop Loss = $95.00 (Risk = $5.00/share). Exit = $115.00.
  - Net P&L / Initial Risk = $15.00 / $5.00 = **+3.00 R**.
- **Zero Risk / Break-even Defense**:
  - Stop Loss omitted or Stop Loss equals Entry Price: Guard against division-by-zero (`return null` or `0.0R` with non-crashing fallback).

---

## 4. CSV Import Test Matrix

| Broker Adapter | Test Case | Expected Outcome |
|---|---|---|
| **ThinkorSwim** | Standard Account Statement CSV with equities & options | All fills parsed; options identified with multiplier 100; dates in `MM/DD/YY HH:MM:SS` normalized. |
| **Tradovate** | Futures orders report with contract multipliers (ES, NQ) | Multipliers mapped correctly; buy/sell paired into completed round-trips. |
| **NinjaTrader 8** | Executions grid export | Precise fill timestamps, account tags, commission column extracted accurately. |
| **MetaTrader 4/5** | Closed trades report | Currency detection, lot size to unit translation, swap/commission fields reconciled. |
| **Interactive Brokers** | Activity Flex Query CSV | Multi-currency conversions, complex multi-leg fills aggregated. |
| **Duplicate Ingestion** | Uploading the identical CSV twice | Duplicate rows identified via SHA-256 execution fingerprint; 0 duplicate trades created; report returns "N duplicates skipped". |
| **Malformed File** | Missing required headers or corrupted rows | Graceful error response identifying specific row line numbers without database corruption. |

---

## 5. Security & Multi-Tenant Isolation Tests

1. **Cross-Tenant Read Test**:
   - Create User A and User B.
   - User A creates Trading Account `ACC-A` and Trade `TRD-A`.
   - User B attempts `GET /api/v1/trades/TRD-A` using User B's authentication token.
   - **Assert**: Response is `404 Not Found` or `403 Forbidden`; zero leakage of User A's trade data.
2. **Cross-Tenant Mutation Test**:
   - User B attempts `DELETE /api/v1/trades/TRD-A`.
   - **Assert**: Response is `404 Not Found`; User A's trade remains intact in database.
3. **Role-Based Admin Guard**:
   - Regular User attempts `GET /api/v1/admin/users`.
   - **Assert**: Response is `403 Forbidden`.

---

## 6. End-to-End (E2E) Test Scenarios

### E2E Flow 1: New User Onboarding & First Manual Trade
1. Visit `/register`, fill out form, submit.
2. Verify redirect to dashboard onboarding.
3. Create trading account: "Futures Prop Firm Account".
4. Open "Add Trade" modal, enter Long NQ trade details with Stop Loss.
5. Verify trade appears in Trade Log, Calendar, and Dashboard widgets.
6. Verify Net P&L and R-Multiple display exact expected values.

### E2E Flow 2: CSV Import Workflow
1. Navigate to `/trades/import`.
2. Upload test CSV (`samples/tradovate_sample.csv`).
3. Verify column mapping step accurately matches fields.
4. Click "Confirm Import".
5. Verify success toast: "14 trades imported successfully".
6. Verify trades appear in journal with correct P&L and metrics.

### E2E Flow 3: Daily Journal & Discipline Checklist
1. Navigate to `/journal`.
2. Select current date.
3. Fill out pre-market plan and post-market review.
4. Check off 3 discipline rules.
5. Save entry. Refresh page and verify persistence.

### E2E Flow 4: Subscription Upgrade & Billing
1. Navigate to `/billing`.
2. Select "Pro Plan" ($49/month).
3. Verify checkout session initiation.
4. Mock successful webhook delivery (`checkout.session.completed`).
5. Verify user entitlements unlock CSV import and advanced analytics.
