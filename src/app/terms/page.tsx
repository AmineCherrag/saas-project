import React from "react";
import Link from "next/link";
import styles from "@/app/landing/Landing.module.css";
import { TrendingUp, ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Terms of Service | TradePulse",
  description: "Terms of Service, acceptable use guidelines, and platform disclosures for TradePulse SaaS.",
};

export default function TermsPage() {
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
            Legal Documentation
          </span>
          <h1 style={{ fontSize: "36px", fontWeight: 800, marginTop: "8px", marginBottom: "12px", color: "var(--color-text-primary)" }}>
            Terms of Service
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            Effective Date: January 1, 2026 • Last Updated: October 16, 2026
          </p>
        </div>

        {/* Not Financial Advice Callout Box */}
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "40px",
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
          }}
        >
          <ShieldAlert size={24} style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f87171", marginBottom: "6px" }}>
              IMPORTANT DISCLAIMER: NOT FINANCIAL OR INVESTMENT ADVICE
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
              TradePulse is an analytical trading journal and quantitative performance tracking software. TradePulse is
              <strong> NOT</strong> a registered investment advisor, broker-dealer, commodity trading advisor (CTA), or financial analyst.
              Nothing contained within the platform, documentation, or reports constitutes financial, investment, legal, tax, or trading advice.
              Trading equities, options, futures, forex, and cryptocurrency products involves substantial risk of loss and is not suitable for every investor.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px", color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.8 }}>
          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, registering for, or using the TradePulse application, website, or APIs (collectively, the &quot;Service&quot;),
              operated by TradePulse Technologies Inc. (&quot;TradePulse&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
              you agree to be legally bound by these Terms of Service. If you do not agree to these terms, you must not access or use the Service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              2. User Accounts & Eligibility
            </h2>
            <p>
              To access TradePulse, you must be at least 18 years of age and possess the legal authority to enter into these Terms.
              You must provide accurate, current, and complete registration information. You are solely responsible for maintaining
              the confidentiality of your login credentials and session tokens, and for all activities that occur under your account.
              You must notify us immediately at <code>security@tradepulse.io</code> upon discovering any unauthorized access to your account.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              3. Subscription Plans & 14-Day Free Pro Trial
            </h2>
            <p>
              New registered users are eligible for a complimentary 14-day full-access Pro Trial. No credit card is required to initiate
              the trial. Following the 14-day trial period, continuing access requires selecting a paid subscription tier (Starter, Pro, or Elite)
              billed on a monthly or annual cadence. Subscriptions renew automatically unless cancelled prior to the end of the current billing cycle.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              4. Multi-Tenant Data Isolation & Data Ownership
            </h2>
            <p>
              All trade data, broker execution files, journal entries, and custom playbooks created or imported by you remain your exclusive property.
              TradePulse enforces strict multi-tenant database scoping: your account credentials, trades, and financial analytics are partitioned
              such that no other user may inspect, query, or view your records. We will never sell or share your proprietary trading strategies with third parties.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              5. Acceptable Use & Prohibited Conduct
            </h2>
            <p>
              You agree not to reverse engineer, decompile, scrape, or probe the Service; exploit security vulnerabilities; circumvent authentication
              or rate limits; upload malicious payloads; or attempt to access data belonging to other accounts or administrative portals.
              Violation of this policy will result in immediate termination of service and potential referral to law enforcement.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              6. Limitation of Liability & Warranty Disclaimer
            </h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              IN NO EVENT SHALL TRADEPULSE TECHNOLOGIES INC. BE LIABLE FOR ANY TRADING LOSSES, LOST PROFITS, SYSTEM DOWNTIME, OR INDIRECT DAMAGES
              ARISING OUT OF OR IN CONNECTION WITH THE USE OF OR INABILITY TO USE THE SERVICE. YOU ASSUME FULL AND EXCLUSIVE RESPONSIBILITY
              FOR ALL FINANCIAL TRANSACTIONS AND RISK TAKEN IN FINANCIAL MARKETS.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "12px" }}>
              7. Contact & Inquiries
            </h2>
            <p>
              Questions regarding these Terms of Service may be addressed to our legal compliance division at:
              <br />
              <strong>TradePulse Technologies Inc.</strong>
              <br />
              Email: <code>legal@tradepulse.io</code>
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
