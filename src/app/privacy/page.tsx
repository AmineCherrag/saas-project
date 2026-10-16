import React from "react";
import Link from "next/link";
import styles from "@/app/landing/Landing.module.css";
import { TrendingUp, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Privacy Policy | TradePulse",
  description: "Privacy policy, data protection, and GDPR/CCPA compliance terms for TradePulse.",
};

export default function PrivacyPage() {
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
            Privacy & Trust
          </span>
          <h1 style={{ fontSize: "36px", fontWeight: 800, marginTop: "8px", marginBottom: "12px", color: "var(--color-text-primary)" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            Effective Date: January 1, 2026 • Last Updated: October 16, 2026
          </p>
        </div>

        {/* Security Commitment Box */}
        <div
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "40px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
          }}
        >
          <ShieldCheck size={24} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#34d399", marginBottom: "6px" }}>
              Our Strict Multi-Tenant Privacy Guarantee
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
              At TradePulse, your trading history, financial transactions, and strategy playbooks are strictly private.
              Every database record is scoped to your unique authenticated user ID. We never sell, monetize, or allow
              competing traders or third parties to access your execution records.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px", color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              1. Information We Collect
            </h2>
            <p>We collect information you directly provide when using TradePulse:</p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Account Credentials:</strong> Name, email address, password hash (salted using bcrypt factor 12), and preferred timezone/base currency.</li>
              <li><strong>Trading Data:</strong> Broker CSV files, trade executions, entry/exit timestamps, instrument symbols, asset classes, quantities, prices, commissions, and tags that you upload or record.</li>
              <li><strong>Journal & Psychology Data:</strong> Personal reflections, daily notes, checklists, and emotional review ratings.</li>
              <li><strong>Technical Metadata:</strong> IP address, browser user-agent, and session identifiers collected for security audit logs and abuse prevention.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              2. How We Use Your Data
            </h2>
            <p>
              Your data is processed strictly to provide software functionality: calculating quantitative metrics (win rates, profit factor, R-multiples, drawdown),
              generating executive reports, indexing trading calendar heatmaps, and maintaining your session security. We do not use your trading data
              for automated market trading, counter-party positioning, or algorithmic front-running.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              3. Payment Processing & Billing Information
            </h2>
            <p>
              All subscription payments and billing transactions are securely handled via Stripe. TradePulse does not store, process,
              or transmit raw credit card numbers or CVV codes on our servers. All financial payment details are tokenized directly
              with Stripe under industry standard payment security protocols.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              4. Cookies & Session Security
            </h2>
            <p>
              We use strictly necessary HTTP-only session cookies (<code>tradepulse_session</code>) to maintain authenticated sessions
              across page navigation. These cookies are cryptographically generated, configured with <code>SameSite=Lax</code> and <code>Secure</code> flags,
              and expire automatically after 30 days or immediately upon sign-out.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              5. Your Rights Under GDPR & CCPA
            </h2>
            <p>Regardless of your geographic location, TradePulse grants all users full data autonomy:</p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li><strong>Right of Access & Export:</strong> You can export your complete historical archive (trades, accounts, and logs) in standard JSON format anytime via your Settings page.</li>
              <li><strong>Right to Rectification:</strong> You may update or correct your profile details directly from the user dashboard.</li>
              <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You may permanently terminate your account in Settings, triggering a permanent cascading deletion of all your stored records.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              6. Contact Privacy Team
            </h2>
            <p>
              To exercise your data privacy rights or ask questions regarding our data governance policies, please contact:
              <br />
              <strong>TradePulse Data Protection Office</strong>
              <br />
              Email: <code>privacy@tradepulse.io</code>
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
