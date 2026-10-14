# Security & Compliance Plan: TradePulse SaaS
**Application Security, Multi-Tenant Data Isolation & Payment Protection**

---

## 1. Security Architecture Principles

TradePulse handles sensitive financial data, trade execution histories, and recurring payment transactions. The security posture is built on defense-in-depth:
1. **Zero-Trust Multi-Tenancy**: No query or API handler assumes tenant context; every data read and write enforces explicit user ownership verification.
2. **Least Privilege**: Application processes, database roles, and administrative staff operate with minimal necessary privileges.
3. **PCI-DSS Compliance via Hosted Processing**: No credit card numbers, CVVs, or bank details are ever transmitted through or stored on TradePulse servers.
4. **Complete Input Sanitization**: All incoming data is parsed and validated by strict Zod schemas before reaching the business logic layer.

---

## 2. Multi-Tenant Data Isolation

### 2.1 Enforcement at the Query Layer
Every database model containing user-specific information (trading accounts, trades, executions, playbooks, journals, attachments) includes a foreign key `userId`.
- **Query Interceptor Pattern**: Data access services inject `where: { userId: session.user.id }` automatically.
- **Cross-Tenant Attack Prevention**: When accessing a sub-resource by ID (e.g., `/api/v1/trades/:tradeId`), the query explicitly validates:
  ```typescript
  const trade = await prisma.trade.findFirst({
    where: {
      id: tradeId,
      userId: session.user.id, // Mandatory tenant constraint
    },
  });
  if (!trade) throw new NotFoundError("Trade not found or access denied");
  ```
- **ID Enumeration Protection**: All primary keys utilize high-entropy UUIDv4 strings rather than auto-incrementing sequential integers, preventing resource enumeration.

---

## 3. Authentication & Session Security

### 3.1 Password Protection
- **Hashing**: Passwords are encrypted using **bcrypt** with a cost work factor of **12**.
- **Password Complexity**: Minimum 8 characters, requiring at least one uppercase letter, one lowercase letter, one number, and one special character.
- **Account Lockout & Rate Limiting**: Maximum 5 failed login attempts per IP/Email within a 15-minute sliding window before triggering a temporary rate limit cooldown.

### 3.2 Session & Token Architecture
- **Session Mechanism**: NextAuth.js JWT-based session strategy stored in `HttpOnly`, `Secure` (HTTPS only), `SameSite=Lax` cookies.
- **Token Lifespan**: Maximum 30-day rolling expiration with periodic token invalidation upon password reset or security-critical events.
- **Two-Factor Authentication (2FA)**: RFC 6238 TOTP (Time-based One-Time Password) support compatible with Google Authenticator, Authy, and 1Password, storing encrypted secret keys.

---

## 4. Payment Security & Webhook Integrity

### 4.1 Payment Gateway Isolation
- All payment workflows utilize hosted checkout pages provided by Stripe or Lemon Squeezy.
- Customer cardholder data never touches TradePulse application memory or storage, guaranteeing SAQ-A PCI compliance.

### 4.2 Webhook Signature Verification
- Webhook endpoints verify cryptographic HMAC SHA-256 signatures using the provider's signing secret prior to parsing payloads.
- Requests with invalid or missing signatures are rejected immediately with HTTP 400.
- **Replay & Duplicate Protection**: Every webhook event ID is recorded in the `webhook_events` table within an atomic transaction. If an event ID has already been marked as `PROCESSED`, subsequent invocations return HTTP 200 immediately without executing state transitions twice.

---

## 5. Application Security & Defenses

### 5.1 Injection Attacks
- **SQL Injection**: Prevented by utilizing Prisma ORM, which issues strictly parameterized prepared statements for all database operations.
- **Cross-Site Scripting (XSS)**: User input rendered in the journal is sanitized using `DOMPurify` to neutralize malicious `<script>` or event-handler payloads. React's default JSX escaping protects all standard UI data bindings.

### 5.2 Cross-Site Request Forgery (CSRF)
- NextAuth.js includes built-in CSRF token protection on all mutation endpoints.
- Cookie flags `SameSite=Lax` restrict third-party websites from dispatching unauthorized state-changing requests.

### 5.3 File Upload Security
- Attachments (trade screenshots, playbook setups) are never processed directly as executable files on the server.
- The server generates short-lived presigned PUT URLs directly to S3 / Cloudflare R2 storage.
- File uploads are validated for:
  - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`.
  - Maximum file size: 5 MB per attachment.
  - Virus/malware scanning hook support for high-volume uploads.

### 5.4 Security Headers
The application enforces standard security headers across all responses:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 6. Privacy, Audit Logging & Compliance (GDPR/CCPA)

- **Audit Logging**: All sensitive administrative actions (user suspension, role changes, billing overrides) and security events (password resets, 2FA changes) are logged in the `audit_logs` table with timestamp, IP address, user agent, and action payload.
- **Data Export**: Users can request a complete data export from their profile settings, generating a downloadable ZIP package containing their profile, trading accounts, trade logs, and journal entries in JSON and CSV formats.
- **Right to Erasure (Account Deletion)**: Users can permanently delete their accounts. Foreign key cascades purge all associated trades, executions, accounts, and journal notes permanently from the database.
