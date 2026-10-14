# Business & Subscription Model: TradePulse SaaS
**Commercial Packaging, Pricing Strategy & Entitlement Architecture**

---

## 1. Commercial SaaS Strategy

TradePulse operates as a recurring B2C/B2B subscription SaaS tailored to retail traders, prop firm participants, and small trading syndicates. 

### Core Monetization Principles
- **Self-Service Freemium / Trial**: 7-day full-featured free trial (Pro tier) without upfront credit card requirements to drive top-of-funnel conversion.
- **Value-Gated Pricing**: Pricing scales with account complexity (number of trading accounts), automation (CSV vs manual), and quantitative depth (advanced analytics and AI mentor).
- **Annual Incentives**: 2 months free ($~17\%$ discount) on annual billing to maximize cash flow and customer lifetime value (LTV).

---

## 2. Subscription Tiers & Entitlement Matrix

| Feature / Limit | **Starter Plan** | **Pro Plan** *(Most Popular)* | **Elite Plan** |
|---|---|---|---|
| **Monthly Pricing** | **$29 / month** | **$49 / month** | **$79 / month** |
| **Annual Pricing** | **$290 / year** ($24.16/mo) | **$490 / year** ($40.83/mo) | **$790 / year** ($65.83/mo) |
| **Trading Accounts** | Up to 2 Accounts | Up to 10 Accounts | **Unlimited Accounts** |
| **Trade Ingestion** | Manual Entry (100 trades/mo) | **Unlimited Trades & CSV Import** | **Unlimited Trades & CSV Import** |
| **Supported Brokers** | All (Manual) | 8+ Major Broker CSV Presets | All Presets + Custom Mapping |
| **Performance Analytics** | Standard Dashboard & Calendar | **Advanced Time, Session & Mistake Reports** | **Full Quantitative Engine + Heatmaps** |
| **Strategy Playbooks** | 1 Active Playbook | **Unlimited Playbooks** | **Unlimited Playbooks + Comparison Matrix** |
| **Trading Journal** | Standard Daily Journal | Rich-Text, Templates & Images | Advanced Templates & Trade Embeds |
| **Discipline & Rules Tracker**| Up to 3 Rules | **Unlimited Rules & Scoring** | **Unlimited Rules & Accountability Alerts** |
| **Trade Replay & Sandbox** | Unavailable | 30-Day Candlestick Replay | **Unlimited Replay & Backtest Sandbox** |
| **AI Trading Mentor** | Unavailable | Unavailable | **Personalized AI Journal Synthesis** |
| **Data Export** | CSV Export | Full JSON & CSV Export | Full JSON, CSV & Raw Database Bundle |
| **Customer Support** | Standard Email (48-hr) | Priority Email (12-hr) | **VIP Dedicated Support** |

---

## 3. Dynamic Entitlement Enforcement Architecture

Feature limits and permissions are **never hardcoded in application logic**. They are stored in the `subscription_plans` database table and evaluated dynamically via a centralized `EntitlementService`.

```typescript
export interface UserEntitlements {
  maxAccounts: number;
  maxTradesPerMonth: number;
  hasCsvImport: boolean;
  hasAdvancedAnalytics: boolean;
  hasPlaybooks: boolean;
  hasAiMentor: boolean;
  hasReplay: boolean;
}

export class EntitlementService {
  static async checkCanCreateAccount(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const activeCount = await prisma.tradingAccount.count({
      where: { userId, status: 'ACTIVE' },
    });

    const limit = subscription?.plan?.maxAccounts ?? 1; // Free fallback
    return activeCount < limit;
  }

  static async checkCanImportCsv(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    return subscription?.plan?.hasCsvImport ?? false;
  }
}
```

---

## 4. Payment Provider Architecture

To maintain commercial flexibility across jurisdictions and regulatory requirements, the payment tier is abstracted behind a provider-agnostic interface:

```typescript
export interface PaymentProvider {
  createCustomer(user: { id: string; email: string; name: string }): Promise<string>;
  createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    clientReferenceId: string;
  }): Promise<{ checkoutUrl: string }>;
  createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ portalUrl: string }>;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean;
  parseWebhookEvent(rawBody: string | Buffer): WebhookEventPayload;
}
```

### Supported Providers
1. **Stripe**: Ideal for direct merchant processing where business entities are registered in supported countries.
2. **Lemon Squeezy / Paddle**: Merchant-of-Record (MoR) solutions handling global sales tax, VAT, and international compliance automatically.

---

## 5. Webhook Lifecycle & State Machine

```
              [ Checkout Initiated ]
                         |
                         v
            [ checkout.session.completed ]
                         |
                         +---> Set status = ACTIVE
                         +---> Set current_period_end
                         +---> Unlock tier entitlements
                         |
         +---------------+---------------+
         |                               |
         v                               v
[ invoice.payment_succeeded ]  [ invoice.payment_failed ]
         |                               |
  (Extend period end)                    +---> Set status = PAST_DUE
                                         +---> Trigger warning email
                                         +---> 3-day grace period
                                         |
                                         v
                         [ customer.subscription.deleted ]
                                         |
                                         +---> Set status = CANCELED
                                         +---> Downgrade to Starter/Free
```

### Webhook Reliability Guarantees
- **Signature Verification**: Validates the cryptographic provider secret on every incoming webhook before any state change.
- **Idempotency Guard**: All incoming event IDs are stored in the `webhook_events` table. If duplicate delivery occurs, the system logs the occurrence and immediately responds with HTTP 200 without duplicate execution.
- **Grace Period**: Failed invoice payments do not instantly lock users out; accounts enter `PAST_DUE` for 72 hours while automatic retry webhooks run.
