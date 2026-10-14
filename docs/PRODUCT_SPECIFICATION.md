# Product Specification: TradePulse SaaS
**Institutional-Grade Trading Journal & Performance Analytics Platform**

---

## 1. Executive Summary & Vision

**TradePulse** is a commercial, multi-tenant Software-as-a-Service (SaaS) platform engineered for retail, prop firm, and professional traders across equities, futures, options, forex, and cryptocurrency markets.

While inspired by the core analytics and journaling capabilities of modern platforms like TradeZella, TradePulse is designed from the ground up with an original brand identity, modern high-performance micro-architecture, frictionless broker CSV ingestion, rigorous trade calculation engines (supporting partial fills, multiple executions, contract multipliers, and multi-currency normalization), interactive TradingView-grade execution replay, a disciplined psychology and rule tracking system, and enterprise-tier subscription and admin lifecycle management.

### Key Value Propositions
1. **Flawless Trade Calculation Engine**: Absolute mathematical accuracy for Long/Short trades, scale-ins, scale-outs, fees, commissions, contract multipliers, and R-multiples with zero silent guessing.
2. **Deep Quantitative Analytics**: Multi-dimensional slicing of trading performance across time (hour, session, day of week), strategy/playbook, instrument, execution quality, and emotional mistakes.
3. **Interactive Journal & Visual Playbook**: Rich-text markdown and canvas-based trade review, candlestick chart visualization with exact entry/exit marker overlays, day notes, and structured pre/post-session checklists.
4. **Discipline & Progress Tracker**: Customizable risk rules, daily execution limits, and accountability scoring to convert undisciplined gamblers into consistent, profitable operators.
5. **Multi-Tenant SaaS & Commercial Engine**: Complete subscription management (Stripe / Lemon Squeezy), role-based access control, tier-based entitlement enforcement, tenant data isolation, and comprehensive administrative oversight.

---

## 2. Target Market & User Personas

| Persona | Primary Goals | Key Pain Points Solved | Target Subscription |
|---|---|---|---|
| **Prop Firm Trader** (Futures/Forex) | Must adhere to strict daily drawdown and profit targets across multiple evaluation accounts. | Tracks multiple accounts simultaneously; alerts on rule breaches; calculates exact R-multiple. | **Pro / Elite** |
| **Active Day Trader** (Equities/Options) | Executes 10–50 trades daily; needs rapid CSV import and execution quality feedback. | Eliminates manual data entry; supports partial fills & option contract multipliers ($100/point). | **Pro** |
| **Swing & Systematic Trader** | Tracks specific setups, edge decay over time, and win-rate by playbook. | In-depth playbook repository, strategy comparison matrix, and Sharpe/Sortino expectancy metrics. | **Pro / Elite** |
| **Beginner / Developing Trader** | Seeks structure, habit building, and mistake mitigation (FOMO, revenge trading). | Daily checklists, pre-market planning, mistake tagging, and emotional discipline scoring. | **Starter** |

---

## 3. Comprehensive Feature Breakdown

### Module 1: Brand Identity & UI/UX Foundation
- **Brand Identity**: Original "TradePulse" branding with an institutional obsidian and slate theme (`#0B0E14` base, `#121824` cards, `#1E293B` borders), luminous emerald (`#10B981`) for profits, crimson coral (`#EF4444`) for losses, and electric indigo (`#6366F1`) for primary accents.
- **Dual Theme Support**: Dark mode (default) and crisp high-contrast light mode.
- **Layout Architecture**: Collapsible sidebar navigation, top global filter bar (account switcher, date range picker, asset class filter), responsive grid layout with fluid cards, and seamless mobile drawer navigation.

### Module 2: Authentication & User Management
- **Registration & Onboarding**: Email/password signup with bcrypt hashing and optional OAuth (Google).
- **Email Verification**: Cryptographic token-based email confirmation workflows.
- **Session Management**: Secure HTTP-only cookies with rotating JWT sessions and CSRF protection.
- **Account Preferences**: User-configurable base currency (USD, EUR, GBP, CAD, AUD, JPY), timezone (with automatic market session adjustment), language, and notification toggles.
- **Security & Privacy**: Two-factor authentication (TOTP), password reset flows, complete user data export (JSON/CSV bundle), and GDPR/CCPA compliant self-service account deletion with cascading purge.

### Module 3: Multi-Trading Accounts
- **Multi-Account Hierarchy**: Users can manage multiple isolated or aggregated trading accounts.
- **Account Fields**: Account Name, Broker Name, Account Type (Cash, Margin, Prop Evaluation, Prop Funded, Demo), Asset Class (Stocks, Futures, Forex, Crypto, Options, CFDs), Initial Balance, Current Balance, Currency, Status (Active, Archived, Breached).
- **Global & Account Filtering**: View unified analytics across all accounts or isolate single accounts.

### Module 4: Trade Management & Calculation Engine
- **Supported Instruments**: Equities, Equity Options, Futures contracts (with point multipliers such as ES=$50, NQ=$20), Forex pairs (pip calculations), Cryptocurrencies, and CFDs.
- **Execution Structure**:
  - Support for single-fill trades and complex multi-execution orders (scale-in entries, scale-out partial profit takes, trailing stops).
  - Explicit validation of direction: `LONG` or `SHORT`.
- **Calculations**:
  - Gross P&L = $(\text{Exit Price} - \text{Entry Price}) \times \text{Quantity} \times \text{Multiplier}$ (inverted for Shorts).
  - Net P&L = $\text{Gross P&L} - \text{Commissions} - \text{Fees}$.
  - Initial Risk ($) = $|\text{Entry Price} - \text{Stop Loss}| \times \text{Quantity} \times \text{Multiplier}$.
  - R-Multiple = $\frac{\text{Net P&L}}{\text{Initial Risk}}$ (when Initial Risk $> 0$).
  - Return % = $\frac{\text{Net P&L}}{\text{Position Capital Invested}} \times 100$.
- **Trade Detail View**:
  - **Left Section**: Summary cards (Net P&L, Return %, R-Multiple, Hold Time, Efficiency score), execution table (Fills with timestamps, prices, qty, fees), tags (Mistakes, Setups), and Risk stats.
  - **Right Section**: Interactive TradingView-style candlestick chart with entry/exit execution arrows, interactive trade notes, attached screenshot gallery, and cumulative trade running P&L.

### Module 5: CSV Import & Broker Data Management
- **Universal CSV Engine**: Step-by-step wizard: Upload $\rightarrow$ Column Mapping $\rightarrow$ Preview & Validation $\rightarrow$ Ingestion.
- **Automated Broker Adapters**: Presets for ThinkorSwim, Interactive Brokers (Flex Query), Tradovate, NinjaTrader 8, MetaTrader 4/5, Webull, Robinhood, Binance, and Bybit.
- **Validation & Duplicate Protection**: SHA-256 fingerprinting of execution lines to prevent duplicate trade ingestion; symbol normalization (e.g., `ESZ4`, `/ES`, `ES=F` $\rightarrow$ standardized continuous symbol); date format auto-detection.
- **Error Handling**: Row-by-row error logs with downloadable rejection reports.
- **Audit History**: Ability to view past imports and revert/cancel an import batch safely.

### Module 6: Main Dashboard & Performance Analytics
- **Executive Metrics**: Net P&L, Gross P&L, Total Trades, Win Rate %, Profit Factor ($\frac{\sum \text{Gains}}{\sum |\text{Losses}|}$), Expectancy ($(\text{Win Rate} \times \text{Avg Win}) - (\text{Loss Rate} \times \text{Avg Loss})$), Average Winner, Average Loser, Win/Loss Ratio, Avg R-Multiple, Max Drawdown ($ and %), Total Fees.
- **Visual Analytics**:
  - Cumulative P&L curve (equity progression over time).
  - Daily, Weekly, and Monthly P&L bar charts.
  - Win/Loss ratio donut chart.
  - Performance by strategy, instrument, and trading session.
- **Interactive Calendar**:
  - Monthly calendar with daily Net P&L badges, trade counts, and win rates.
  - Visual color coding: Profit (emerald), Loss (crimson), Break-even (slate).
  - Clicking any date drill-downs directly into that trading day's journal, execution list, and notes.

### Module 7: Advanced Analytics & Reporting
- **Time Analysis**: Performance breakdown by Hour of Day, Trading Session (Asian, London, NY Pre, NY Open, NY Close), Day of Week, Month, and Year.
- **Instrument Analysis**: Symbol profitability rankings, volume distribution, win rate per ticker.
- **Strategy Analysis**: Setup win rates, profit factor per entry model, Long vs. Short performance comparison.
- **Execution Quality**: Holding duration distribution (Scalp, Day, Swing), R-multiple distribution histogram, Slippage and Commission impact analysis.
- **Behavioral & Mistake Analytics**: Cost of mistakes (e.g., total dollars lost to "Chased Entry" or "Moved Stop Loss"), win/loss streaks, and drawdown recovery periods.

### Module 8: Daily Journal & Notebook
- **Daily Operating Rhythm**: Pre-session planning (market context, key levels, watchlists), post-session review (adherence to rules, emotional state rating), weekly/monthly reviews.
- **Rich-Text Editor**: Markdown support, headings, checklists, image attachments, trade embed widgets.
- **Structured Templates**: Built-in templates for "Morning Gameplan", "End of Day Debrief", "Weekly Wrap-up", with ability to create custom templates.

### Module 9: Strategies & Playbook Builder
- **Strategy Profiles**: Name, description, setup rules, entry criteria, exit criteria, risk rules, preferred session, and sample textbook chart screenshots.
- **Performance Association**: Every trade can be tagged with a playbook strategy.
- **Comparative Playbook Matrix**: Side-by-side performance comparison to identify edge decay and best-performing market conditions.

### Module 10: Progress & Discipline Tracker
- **Rule Engine**: Define custom rules with daily/weekly limits (e.g., "Max 3 losses per day", "Never risk more than $200 per trade", "Stop trading after 11:30 AM").
- **Daily Check-in**: Interactive checklist on the dashboard.
- **Discipline Score**: Automated daily rating ($0-100\%$) based on rule adherence and lack of mistake tags.

### Module 11: Advanced Features (Architecture-Ready)
- **Trade Replay**: Canvas-based candle-by-candle market replay with synchronized trade fill markers and adjustable playback speed ($0.5x$ to $10x$).
- **Backtesting Sandbox**: Isolated sandbox environment to test historical rule sets without polluting live trading statistics.
- **AI Analytics & Mentor**: LLM-powered engine that analyzes real trade logs to discover non-obvious statistical anomalies (e.g., "On Tuesdays when trading NQ after 2:00 PM, your win rate drops to 22%").

### Module 12: Subscription & Payment Engine
- **Subscription Tiers**:
  - **Starter** ($29/mo or $290/yr): 2 Trading Accounts, manual trade entry, standard dashboard, basic journal.
  - **Pro** ($49/mo or $490/yr): 10 Trading Accounts, unlimited trades, CSV broker import, advanced analytics, playbooks, progress tracker.
  - **Elite** ($79/mo or $790/yr): Unlimited Trading Accounts, AI analytics assistant, priority support, backtesting sandbox, trade replay.
- **Billing Features**: Monthly/annual billing toggles, discount codes, 7-day free trial, self-service customer portal (upgrade, downgrade, cancel, invoice downloads).
- **Webhooks**: Idempotent signature-verified processing of `subscription.created`, `subscription.updated`, `invoice.payment_succeeded`, `invoice.payment_failed`, and `subscription.canceled`.

### Module 13: Administrator Dashboard
- **Executive SaaS KPIs**: Total Users, Active Subscriptions, Churn Rate, Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), Failed Payments.
- **User Management**: Search users, view subscription status, impersonate/view tenant logs, suspend/reactivate accounts.
- **Plan Management**: Dynamic pricing and entitlement limit configuration without code deployments.
- **Audit Logs**: Tamper-evident administrative audit trail of all privilege escalations, billing overrides, and account suspensions.

### Module 14: Public Marketing Website
- **Pages**: Homepage (Hero, Interactive Dashboard Demo, Features, Testimonials, FAQ), Features Deep Dive, Pricing Matrix, About Us, Contact, Privacy Policy, Terms of Service, Refund Policy.
- **SEO & Performance**: Server-side rendered (SSR), semantic HTML5, OpenGraph meta tags, JSON-LD schema markup, sub-second First Contentful Paint.

### Module 15: Customer Support & Transactional Communications
- **Ticketing System**: In-app support ticket submission, categorization (Billing, Bug, Feature Request, Data Import Help), and resolution tracking.
- **Transactional Emails**: Welcome email, email verification, password reset, subscription confirmation, payment failure warning, invoice receipt.

### Module 16: Security, Compliance & Data Isolation
- **Tenant Isolation**: Strict tenant scoping across all database queries (`tenant_id = user_id`).
- **Data Protection**: Encrypted at rest (AES-256) and in transit (TLS 1.3), rate limiting on authentication and API endpoints, sanitized inputs with Zod validation.
