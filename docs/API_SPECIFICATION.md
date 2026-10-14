# API Specification: TradePulse SaaS
**RESTful API Endpoints, Payloads, Query Parameters & Response Envelopes**

---

## 1. API Design Standards

- **Base URL**: `/api/v1`
- **Protocol**: HTTPS / TLS 1.3
- **Format**: JSON (`Content-Type: application/json; charset=utf-8`)
- **Authentication**: Bearer Token or Secure HTTP-only session cookie (`next-auth.session-token`).
- **Standard Response Envelope**:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "meta": {
      "timestamp": "2026-10-13T00:00:00.000Z",
      "requestId": "req_abc123"
    }
  }
  ```
- **Standard Error Envelope**:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Invalid input provided",
      "details": [
        { "field": "entryPrice", "issue": "Expected positive number, received -5.00" }
      ]
    },
    "meta": {
      "timestamp": "2026-10-13T00:00:00.000Z",
      "requestId": "req_xyz789"
    }
  }
  ```

---

## 2. Authentication & User Profile Endpoints

### 2.1 Register User
- **`POST /api/v1/auth/register`**
- **Request Body**:
  ```json
  {
    "name": "Jane Trader",
    "email": "jane@example.com",
    "password": "SecurePassword123!",
    "baseCurrency": "USD",
    "timezone": "America/New_York"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "usr_9b1deb4d",
        "email": "jane@example.com",
        "name": "Jane Trader",
        "role": "USER"
      }
    }
  }
  ```

### 2.2 Get Current Profile
- **`GET /api/v1/user/profile`**
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "usr_9b1deb4d",
      "name": "Jane Trader",
      "email": "jane@example.com",
      "baseCurrency": "USD",
      "timezone": "America/New_York",
      "avatarUrl": "https://storage.tradepulse.io/avatars/usr_9b1deb4d.png",
      "subscription": {
        "plan": "Pro",
        "status": "ACTIVE",
        "currentPeriodEnd": "2026-11-13T00:00:00.000Z"
      }
    }
  }
  ```

---

## 3. Trading Account Endpoints

### 3.1 List Accounts
- **`GET /api/v1/accounts`**
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "acc_101",
        "name": "Apex 50k Evaluation",
        "brokerName": "Tradovate",
        "accountType": "PROP_EVALUATION",
        "assetClass": "FUTURES",
        "initialBalance": 50000.00,
        "currentBalance": 52450.00,
        "currency": "USD",
        "status": "ACTIVE"
      }
    ]
  }
  ```

### 3.2 Create Account
- **`POST /api/v1/accounts`**
- **Request Body**:
  ```json
  {
    "name": "Interactive Brokers Live",
    "brokerName": "Interactive Brokers",
    "accountType": "MARGIN",
    "assetClass": "STOCKS",
    "initialBalance": 25000.00,
    "currency": "USD",
    "description": "Primary equities swing account"
  }
  ```
- **Response**: `201 Created`

---

## 4. Trade Management Endpoints

### 4.1 List Trades (Filtered & Paginated)
- **`GET /api/v1/trades?accountId=acc_101&startDate=2026-09-01&endDate=2026-10-12&direction=LONG&page=1&limit=25`**
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "trades": [
        {
          "id": "trd_501",
          "symbol": "NQ",
          "direction": "LONG",
          "status": "CLOSED",
          "entryTime": "2026-10-12T14:32:00.000Z",
          "exitTime": "2026-10-12T14:48:00.000Z",
          "entryPrice": 18250.25,
          "exitPrice": 18275.50,
          "quantity": 2,
          "contractMultiplier": 20.0,
          "netPnl": 1005.00,
          "rMultiple": 2.1,
          "playbook": { "name": "NY Open Breakout" },
          "tags": ["A+ Setup", "Followed Plan"]
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 25,
        "totalTrades": 142,
        "totalPages": 6
      }
    }
  }
  ```

### 4.2 Create Manual Trade
- **`POST /api/v1/trades`**
- **Request Body**:
  ```json
  {
    "accountId": "acc_101",
    "symbol": "ES",
    "assetClass": "FUTURES",
    "direction": "LONG",
    "entryTime": "2026-10-12T15:00:00.000Z",
    "exitTime": "2026-10-12T15:22:00.000Z",
    "entryPrice": 5020.50,
    "exitPrice": 5030.50,
    "quantity": 2,
    "contractMultiplier": 50.0,
    "stopLoss": 5015.50,
    "takeProfit": 5035.00,
    "fees": 8.50,
    "commissions": 4.00,
    "playbookId": "pbk_01",
    "rating": 5,
    "notes": "Clean liquidity sweep into 5-minute order block.",
    "tags": [{ "type": "SETUP", "value": "Liquidity Sweep" }]
  }
  ```
- **Response**: `201 Created`

### 4.3 Import CSV
- **`POST /api/v1/trades/import`**
- **Request Body**: Multi-part form data containing:
  - `file`: CSV file buffer.
  - `accountId`: `"acc_101"`
  - `brokerPreset`: `"thinkorswim"` (or custom mapping object).
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "batchId": "imp_99812",
      "totalRows": 45,
      "importedTrades": 38,
      "skippedDuplicates": 7,
      "errors": []
    }
  }
  ```

---

## 5. Analytics & Reporting Endpoints

### 5.1 Overview Analytics
- **`GET /api/v1/analytics/overview?accountId=all&dateRange=last30days`**
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "netPnl": 14820.50,
        "grossPnl": 15410.00,
        "totalFees": 589.50,
        "totalTrades": 64,
        "winningTrades": 41,
        "losingTrades": 23,
        "winRate": 64.06,
        "profitFactor": 2.18,
        "expectancy": 231.57,
        "avgWinner": 540.20,
        "avgLoser": -318.50,
        "winLossRatio": 1.70,
        "avgRMultiple": 1.85,
        "maxDrawdown": 1240.00,
        "maxDrawdownPct": 2.41
      }
    }
  }
  ```

### 5.2 Performance Calendar
- **`GET /api/v1/analytics/calendar?month=2026-10&accountId=all`**
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "days": [
        { "date": "2026-10-01", "netPnl": 450.00, "tradeCount": 3, "winRate": 66.6 },
        { "date": "2026-10-02", "netPnl": -210.00, "tradeCount": 2, "winRate": 0.0 }
      ]
    }
  }
  ```

---

## 6. Daily Journal & Notebook Endpoints

- **`GET /api/v1/journal/:date`** (Fetch journal for date `YYYY-MM-DD`).
- **`PUT /api/v1/journal/:date`** (Upsert daily plan, debrief, checklist, and emotional rating).

---

## 7. Billing & Webhook Endpoints

- **`POST /api/v1/billing/checkout`** (Initiate Stripe/Lemon Squeezy checkout session).
- **`POST /api/v1/billing/portal`** (Generate customer self-service billing portal session).
- **`POST /api/v1/webhooks/stripe`** (HMAC-verified webhook endpoint for subscription lifecycle).

---

## 8. Administrative Endpoints (Admin Role Required)

- **`GET /api/v1/admin/overview`** (Global MRR, ARR, active subscriber count, churn rate).
- **`GET /api/v1/admin/users?query=alex&status=active`** (Search and manage all users).
- **`PUT /api/v1/admin/users/:id/status`** (Suspend or activate user account).
- **`PUT /api/v1/admin/plans/:id`** (Modify plan pricing, limits, and active status).
