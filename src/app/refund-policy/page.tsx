import React from "react";
import Link from "next/link";
import styles from "@/app/landing/Landing.module.css";
import { TrendingUp, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Refund & Cancellation Policy | TradePulse",
  description: "Subscription cancellation terms, trial details, and refund policy for TradePulse.",
};

export default function RefundPolicyPage() {
  return (
    <div className={styles.landingWrapper}>
      {/* Background Ambience */}
      <div className={styles.backgroundGlow} />

      {/* Top Navbar */}
      <header className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.brand}>
            <div className={styles.brandIcon}>
              <TrendingUp size={22} />
            </div>
            <span className={styles.brandText}>TradePulse</span>
          </Link>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link href="/">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />}>
                Back to Home
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Start 14-Day Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 24px 100px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: "36px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-primary-400)" }}>
            Billing & Subscriptions
          </span>
          <h1 style={{ fontSize: "36px", fontWeight: 800, marginTop: "8px", marginBottom: "12px", color: "var(--color-text-primary)" }}>
            Refund & Cancellation Policy
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            Effective Date: January 1, 2026 • Last Updated: October 16, 2026
          </p>
        </div>

        {/* Highlight Box */}
        <div
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "40px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
          }}
        >
          <RefreshCw size={24} style={{ color: "#3b82f6", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#60a5fa", marginBottom: "6px" }}>
              14-Day Zero-Risk Trial & Transparent Billing
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
              We want every trader to experience the performance benefits of TradePulse with complete confidence.
              That is why all new users receive an instant 14-day free Pro Trial with no credit card required up front,
              and simple one-click cancellation anytime directly in your Billing portal.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px", color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              1. 14-Day Free Pro Trial
            </h2>
            <p>
              When you register for TradePulse, you receive 14 days of complimentary, unrestricted access to the Pro Plan.
              Because no payment method is required to initiate the trial, you will never be charged automatically at the conclusion
              of your trial unless you actively choose to select a subscription plan.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              2. Monthly Subscriptions
            </h2>
            <p>
              Monthly subscription fees are billed in advance on a recurring monthly cycle. You can cancel your monthly subscription
              at any time with a single click in your Billing dashboard. When you cancel a monthly subscription:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Your account remains active and accessible through the end of your current paid monthly period.</li>
              <li>You will not be billed for any subsequent months following cancellation.</li>
              <li>Because monthly plans can be tested free during the 14-day trial, monthly payments are generally non-refundable once billed, except in cases of technical billing error.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              3. Annual Subscriptions & 14-Day Money-Back Guarantee
            </h2>
            <p>
              Annual plans provide a 20% discount compared to monthly billing. We offer a <strong>14-day money-back guarantee</strong> on all
              annual subscription purchases. If you purchase an annual plan and decide TradePulse is not right for you, contact our support team
              within 14 days of your initial annual charge for a full refund.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              4. How to Request a Refund or Cancel
            </h2>
            <p>To cancel your subscription or submit a refund request:</p>
            <ol style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Self-Service Cancellation:</strong> Navigate to your <strong>Billing & Plan</strong> tab and click &quot;Cancel Subscription&quot;.</li>
              <li><strong>Support Inquiries:</strong> Submit a support ticket from your dashboard or email <code>billing@tradepulse.io</code> with your account email address.</li>
            </ol>
            <p style={{ marginTop: "12px" }}>
              Approved refunds are credited back to the original payment method through Stripe within 5 to 10 business days depending on your bank.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              5. Not Financial Advice Disclaimer
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              Please note that TradePulse provides analytical and recording tools only. Trading performance depends solely on individual execution
              and market risks. No refunds will be granted on the basis of trading losses incurred in personal or funded trading accounts.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div style={{ maxWidth: "340px" }}>
            <div className={styles.brand} style={{ marginBottom: "16px" }}>
              <div className={styles.brandIcon}>
                <TrendingUp size={20} />
              </div>
              <span className={styles.brandText}>TradePulse</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              Institutional-grade trading performance analytics and multi-account journal.
            </p>
          </div>
          <div>
            <h5 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px", color: "var(--color-text-primary)" }}>Legal & Policies</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <Link href="/terms" className={styles.navLink}>Terms of Service</Link>
              <Link href="/privacy" className={styles.navLink}>Privacy Policy</Link>
              <Link href="/refund-policy" className={styles.navLink}>Refund Policy</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", width: "100%" }}>
            <div>© 2026 TradePulse Technologies Inc. All rights reserved.</div>
            <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
              <Link href="/terms" className={styles.navLink}>Terms</Link>
              <Link href="/privacy" className={styles.navLink}>Privacy</Link>
              <Link href="/refund-policy" className={styles.navLink}>Refunds</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
