import crypto from "crypto";

export interface StripeWebhookValidationResult {
  isValid: boolean;
  event?: any;
  error?: string;
}

/**
 * Validates Stripe webhook signatures using HMAC-SHA256 and timing-safe equality.
 * Protects against replay attacks and signature forgery without external dependencies.
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): StripeWebhookValidationResult {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!rawBody || rawBody.trim().length === 0) {
    return { isValid: false, error: "Empty webhook payload" };
  }

  // If in local/test environment without a configured webhook secret or with default placeholder
  if (!webhookSecret || webhookSecret.startsWith("whsec_placeholder") || webhookSecret === "whsec_...") {
    try {
      const event = JSON.parse(rawBody);
      return { isValid: true, event };
    } catch {
      return { isValid: false, error: "Invalid JSON payload" };
    }
  }

  if (!signatureHeader) {
    return { isValid: false, error: "Missing stripe-signature header" };
  }

  // Parse t=timestamp,v1=signature elements
  const parts = signatureHeader.split(",");
  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.trim().split("=");
    if (key === "t") {
      timestamp = value;
    } else if (key === "v1" && value) {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return { isValid: false, error: "Malformed stripe-signature header format" };
  }

  // Replay attack prevention: verify timestamp within 5 minutes (300 seconds)
  const eventTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const toleranceSeconds = 300;

  if (isNaN(eventTime) || Math.abs(currentTime - eventTime) > toleranceSeconds) {
    return { isValid: false, error: "Webhook timestamp outside allowed tolerance window" };
  }

  // Compute expected HMAC SHA-256 signature: timestamp + "." + rawBody
  const payloadToSign = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payloadToSign, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  const hasValidSignature = signatures.some((sig) => {
    try {
      const sigBuffer = Buffer.from(sig, "hex");
      return (
        sigBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      );
    } catch {
      return false;
    }
  });

  if (!hasValidSignature) {
    return { isValid: false, error: "Invalid signature: HMAC SHA-256 mismatch" };
  }

  try {
    const event = JSON.parse(rawBody);
    return { isValid: true, event };
  } catch {
    return { isValid: false, error: "Signature verified but payload is not valid JSON" };
  }
}

/**
 * Retrieve configured Stripe price IDs from environment variables
 */
export function getStripePriceId(
  planSlug: "starter" | "pro" | "elite",
  interval: "monthly" | "yearly" = "monthly"
): string {
  const envKey = `STRIPE_${planSlug.toUpperCase()}_${interval.toUpperCase()}_PRICE_ID`;
  const envVal = process.env[envKey];
  if (envVal && !envVal.includes("...")) {
    return envVal;
  }
  // Default test mode price identifier
  return `price_${planSlug}_${interval}_test`;
}

/**
 * Helper to check if Stripe test mode is active
 */
export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return key.startsWith("sk_test_");
}
