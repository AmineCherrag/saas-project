"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./landing/Landing.module.css";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EquityCurveChart } from "@/components/analytics/EquityCurveChart";
import {
  TrendingUp,
  BarChart3,
  Workflow,
  CheckSquare,
  UploadCloud,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
  Lock,
  DollarSign,
  Activity,
  Layers,
  BookOpen,
} from "lucide-react";

const sampleEquityData = [
  { tradeId: "t1", tradeIndex: 1, tradeDate: "2026-10-06", date: "2026-10-06", symbol: "NQ", tradeNetPnl: 450, cumulativePnl: 450, peakPnl: 450, drawdown: 0, drawdownPct: 0 },
  { tradeId: "t2", tradeIndex: 2, tradeDate: "2026-10-07", date: "2026-10-07", symbol: "ES", tradeNetPnl: 620, cumulativePnl: 1070, peakPnl: 1070, drawdown: 0, drawdownPct: 0 },
  { tradeId: "t3", tradeIndex: 3, tradeDate: "2026-10-08", date: "2026-10-08", symbol: "NQ", tradeNetPnl: -240, cumulativePnl: 830, peakPnl: 1070, drawdown: 240, drawdownPct: 22.4 },
  { tradeId: "t4", tradeIndex: 4, tradeDate: "2026-10-09", date: "2026-10-09", symbol: "NQ", tradeNetPnl: 890, cumulativePnl: 1720, peakPnl: 1720, drawdown: 0, drawdownPct: 0 },
  { tradeId: "t5", tradeIndex: 5, tradeDate: "2026-10-10", date: "2026-10-10", symbol: "ES", tradeNetPnl: 1150, cumulativePnl: 2870, peakPnl: 2870, drawdown: 0, drawdownPct: 0 },
  { tradeId: "t6", tradeIndex: 6, tradeDate: "2026-10-11", date: "2026-10-11", symbol: "NQ", tradeNetPnl: 780, cumulativePnl: 3650, peakPnl: 3650, drawdown: 0, drawdownPct: 0 },
  { tradeId: "t7", tradeIndex: 7, tradeDate: "2026-10-12", date: "2026-10-12", symbol: "ES", tradeNetPnl: 1200, cumulativePnl: 4850, peakPnl: 4850, drawdown: 0, drawdownPct: 0 },
];

export default function LandingPage() {
  // ROI Calculator state
  const [monthlyTrades, setMonthlyTrades] = useState(40);
  const [riskPerTrade, setRiskPerTrade] = useState(250);
  const [leakagePercent, setLeakagePercent] = useState(15);

  // Pricing Interval
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Leakage math
  const leakageTrades = Math.round((monthlyTrades * leakagePercent) / 100);
  const monthlyLeaked = leakageTrades * riskPerTrade;
  const annualSaved = monthlyLeaked * 12;
  const proAnnualCost = billingInterval === "yearly" ? 469 : 49 * 12;
  const netRoi = Math.round(((annualSaved - proAnnualCost) / proAnnualCost) * 100);

  const faqs = [
    {
      q: "How does TradePulse compare to TradeZella or manual spreadsheets?",
      a: "TradePulse was engineered from the ground up for zero-friction precision. Unlike spreadsheets that break with scale, TradePulse automatically calculates futures point multipliers ($50/pt on ES, $20/pt on NQ), equity options, scale-in weighted averages, and parses raw broker CSV files from Tradovate, TOS, NT8, MT4/5, and IBKR in milliseconds. Plus, our Mistake Cost Ledger quantifies your emotional leaks in real dollar terms.",
    },
    {
      q: "Is there a free trial, and is a credit card required?",
      a: "Yes! Every new trader gets an instant 14-day full-access Pro Trial with zero credit card required up front. You can import your historical trades, set up your strategy playbooks, and experience our 7-dimensional analytics before deciding on a plan.",
    },
    {
      q: "Can I connect multiple prop firm evaluation accounts?",
      a: "Absolutely. TradePulse supports unlimited evaluation and funded prop firm accounts (Apex, Topstep, FTMO, etc.) with strict tenant isolation and individual account drawdown tracking alongside personal cash and margin portfolios.",
    },
    {
      q: "How secure is my trading data?",
      a: "We adhere to enterprise cybersecurity standards. All sessions use cryptographically hashed bcrypt credentials, and all queries are strictly scoped by user ID with multi-tenant database isolation. We never sell or share execution logs with third parties.",
    },
  ];

  return (
    <div className={styles.landingWrapper}>
      <div className={styles.backgroundGlow} />
      <div className={styles.secondaryGlow} />

      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={`${styles.navContainer} max-w-7xl mx-auto px-6`}>
          <Link href="/" className={styles.brand}>
            <div className={styles.brandLogo}>
              <TrendingUp size={20} />
            </div>
            <span className={styles.brandName}>TradePulse</span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
            <a href="#calculator" className={styles.navLink}>
              ROI Calculator
            </a>
            <a href="#pricing" className={styles.navLink}>
              Pricing
            </a>
            <a href="#testimonials" className={styles.navLink}>
              Reviews
            </a>
            <a href="#faq" className={styles.navLink}>
              FAQ
            </a>
          </div>

          <div className={styles.navActions}>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                Launch App
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`${styles.heroSection} max-w-7xl mx-auto px-6`}>
        <div className={styles.heroBadge}>
          <Sparkles size={14} />
          <span>The Next-Generation Quant Journal for Futures, Equities & Forex</span>
        </div>

        <h1 className={styles.heroTitle}>
          Master Your Edge. <br />
          <span className={styles.gradientText}>Eliminate Emotional Leakage.</span>
        </h1>

        <p className={styles.heroSubtitle}>
          TradePulse is the institutional-grade trading journal and quantitative analytics platform
          that turns volatile guessers into disciplined, funded professionals.
        </p>

        <div className={styles.heroCtas}>
          <Link href="/register">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={16} />}
              style={{ padding: "14px 28px", fontSize: "16px" }}
            >
              Start Free 14-Day Pro Trial
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="lg"
              style={{ padding: "14px 28px", fontSize: "16px" }}
            >
              Explore Live Platform Demo
            </Button>
          </Link>
        </div>

        {/* Live Mockup Canvas */}
        <div className={styles.mockupContainer}>
          <div className={styles.mockupHeader}>
            <div className={styles.mockupDots}>
              <span className={`${styles.dot} ${styles.dotRed}`} />
              <span className={`${styles.dot} ${styles.dotYellow}`} />
              <span className={`${styles.dot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.mockupUrl}>https://app.tradepulse.io/dashboard</div>
            <Badge variant="success">Market Open • Live Feed</Badge>
          </div>

          <div className={styles.mockupBody}>
            <div className={styles.mockupKpis}>
              <div className={styles.mockupKpiCard}>
                <div className={styles.mockupKpiLabel}>Net Realized P&L</div>
                <div className={styles.mockupKpiVal} style={{ color: "#10b981" }}>
                  +$18,450.25
                </div>
                <div className={styles.mockupKpiSub}>+24.6% this month</div>
              </div>
              <div className={styles.mockupKpiCard}>
                <div className={styles.mockupKpiLabel}>Win Rate %</div>
                <div className={styles.mockupKpiVal}>68.4%</div>
                <div className={styles.mockupKpiSub}>39 Wins / 18 Losses</div>
              </div>
              <div className={styles.mockupKpiCard}>
                <div className={styles.mockupKpiLabel}>Profit Factor</div>
                <div className={styles.mockupKpiVal}>2.42</div>
                <div className={styles.mockupKpiSub}>High Expectancy</div>
              </div>
              <div className={styles.mockupKpiCard}>
                <div className={styles.mockupKpiLabel}>Average R-Multiple</div>
                <div className={styles.mockupKpiVal} style={{ color: "var(--color-primary-400)" }}>
                  +1.85 R
                </div>
                <div className={styles.mockupKpiSub}>$2.15 Reward / $1 Risk</div>
              </div>
            </div>

            {/* Simulated mini analytics preview strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "16px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                    EQUITY CURVE & DRAWDOWN
                  </span>
                  <Badge variant="cyan">7-Day Trailing</Badge>
                </div>
                <div
                  style={{
                    height: "120px",
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <EquityCurveChart data={sampleEquityData} height={120} />
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "12px" }}>
                  TOP SETUP EXPECTANCY
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Opening Range Break</span>
                    <strong style={{ color: "#10b981" }}>76.4% WR</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Liquidity Sweep Retest</span>
                    <strong style={{ color: "#10b981" }}>71.2% WR</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>VWAP Mean Reversion</span>
                    <strong style={{ color: "var(--color-primary-400)" }}>62.5% WR</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Broker Compatibility Ribbon */}
      <section className={styles.logosStrip}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={styles.logosTitle}>
            Integrated with Leading Brokers & Prop Firm Platforms
          </div>
          <div className={styles.logosRow}>
            <span className={styles.logoItem}>TRADOVATE</span>
            <span className={styles.logoItem}>THINKORSWIM</span>
            <span className={styles.logoItem}>NINJATRADER 8</span>
            <span className={styles.logoItem}>INTERACTIVE BROKERS</span>
            <span className={styles.logoItem}>METATRADER 4/5</span>
            <span className={styles.logoItem}>APEX TRADER FUNDING</span>
            <span className={styles.logoItem}>TOPSTEP</span>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className={`${styles.featuresSection} max-w-7xl mx-auto px-6`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Engineered For Edge</span>
          <h2 className={styles.sectionTitle}>Everything You Need to Trade Like a Quantitative Fund</h2>
          <p className={styles.sectionSubtitle}>
            TradePulse replaces chaotic screenshots and inaccurate spreadsheets with automated math,
            objective playbooks, and disciplined routine enforcement.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <UploadCloud size={24} />
            </div>
            <h3 className={styles.featureTitle}>1-Click Automated Broker Ingestion</h3>
            <p className={styles.featureText}>
              Drop CSV files from Tradovate, TOS, NinjaTrader 8, MT4/5, or IBKR. Our streaming parser
              fingerprints orders with SHA-256 hashes to prevent duplicate fills and automatically
              reconciles account balances.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <BarChart3 size={24} />
            </div>
            <h3 className={styles.featureTitle}>7-Dimensional Quantitative Analytics</h3>
            <p className={styles.featureText}>
              Slice your win rate, profit factor, and expectancy across Hourly Buckets, Global Sessions
              (London, NY AM, NY PM), Symbol Assets, Duration Spans, and Long/Short directions to find your true sweet spot.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <DollarSign size={24} />
            </div>
            <h3 className={styles.featureTitle}>Mistake Leakage & Cost Ledger</h3>
            <p className={styles.featureText}>
              Tag emotional leaks (FOMO, Revenge Trading, Widened Stop Loss). TradePulse totals the exact
              dollar leakage, showing you the exact account balance you would have achieved with pure discipline.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Workflow size={24} />
            </div>
            <h3 className={styles.featureTitle}>Strategy Playbooks & Setups</h3>
            <p className={styles.featureText}>
              Define entry criteria, stop placement rules, and target guidelines for your setups.
              Track win rates and average R-multiples per playbook to eliminate low-edge setups.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Activity size={24} />
            </div>
            <h3 className={styles.featureTitle}>Interactive Candlestick Replay Canvas</h3>
            <p className={styles.featureText}>
              Review each trade on interactive dual-pane candlestick charts with automatic Entry (▲)
              and Exit (▼) markers, scale-in trails, and time-stamped execution tickets.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <CheckSquare size={24} />
            </div>
            <h3 className={styles.featureTitle}>Daily Routine & Adherence Streaks</h3>
            <p className={styles.featureText}>
              Reinforce high-performance habits with daily checklist rules (Max 3 trades/day, Never risk {">"} 1%,
              Mandatory debrief). Track your consecutive adherence streak and discipline score.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Leakage / ROI Calculator */}
      <section id="calculator" className={styles.calcSection}>
        <div className={`${styles.calcContainer} max-w-7xl mx-auto px-6`}>
          <div className={styles.calcInputs}>
            <div>
              <span className={styles.sectionTag}>Interactive Calculator</span>
              <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>
                Calculate Your Emotional Leakage
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>
                Most unprofitable traders don't have a strategy problem — they have an emotional leak.
                See how much capital TradePulse saves by enforcing discipline.
              </p>
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Monthly Trade Volume</span>
                <span className={styles.sliderValue}>{monthlyTrades} trades / mo</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={monthlyTrades}
                onChange={(e) => setMonthlyTrades(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Average Risk per Trade ($)</span>
                <span className={styles.sliderValue}>${riskPerTrade}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>FOMO / Rule Violation Rate (%)</span>
                <span className={styles.sliderValue}>{leakagePercent}% of trades</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={leakagePercent}
                onChange={(e) => setLeakagePercent(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>
          </div>

          <div className={styles.calcResultsBox}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
              Estimated Monthly Leaked Capital
            </div>
            <div className={styles.savedAmount}>
              ${monthlyLeaked.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className={styles.roiPill}>
              Projected Annual Capital Saved: ${annualSaved.toLocaleString("en-US")}
            </div>

            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
              By plugging emotional leaks with TradePulse rule checks and mistake tagging, you could
              preserve <strong>${annualSaved.toLocaleString("en-US")}</strong> every year — yielding a{" "}
              <strong style={{ color: "#10b981" }}>+{netRoi}% net ROI</strong> on your subscription.
            </p>

            <Link href="/register">
              <Button
                variant="primary"
                style={{ width: "100%" }}
                rightIcon={<ArrowRight size={16} />}
              >
                Plug Your Leaks With TradePulse
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section id="pricing" className={`${styles.pricingSection} max-w-7xl mx-auto px-6`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Transparent Plans</span>
          <h2 className={styles.sectionTitle}>Simple, High-Value Pricing</h2>
          <p className={styles.sectionSubtitle}>
            14-day full Pro trial included. No setup fees, cancel anytime with one click.
          </p>

          <div style={{ marginTop: "24px", display: "inline-flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => setBillingInterval("monthly")}
              style={{
                background: billingInterval === "monthly" ? "var(--color-primary-600)" : "transparent",
                color: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: "999px",
                padding: "8px 20px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Monthly Billed
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              style={{
                background: billingInterval === "yearly" ? "var(--color-primary-600)" : "transparent",
                color: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: "999px",
                padding: "8px 20px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Annual Billed (20% Off)
            </button>
          </div>
        </div>

        <div className={styles.featuresGrid}>
          {/* Starter Card */}
          <div className={styles.featureCard}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Starter Trader</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", minHeight: "40px" }}>
              Essential journaling and broker imports for developing retail traders.
            </p>
            <div style={{ margin: "20px 0" }}>
              <span style={{ fontSize: "36px", fontWeight: 800 }}>
                ${billingInterval === "yearly" ? "23" : "29"}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}> / month</span>
            </div>
            <Link href="/register?plan=starter">
              <Button variant="outline" style={{ width: "100%", marginBottom: "20px" }}>
                Start With Starter
              </Button>
            </Link>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div>✓ 2 Connected Trading Accounts</div>
              <div>✓ 100 Trades / month</div>
              <div>✓ CSV & Broker Importers</div>
              <div>✓ Executive Calendar & Dashboard</div>
              <div>✓ Daily Journal Notes</div>
            </div>
          </div>

          {/* Pro Card (Featured) */}
          <div
            className={styles.featureCard}
            style={{
              borderColor: "var(--color-primary-500)",
              background: "linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
              boxShadow: "0 10px 30px -5px rgba(59, 130, 246, 0.3)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(90deg, var(--color-primary-500), #8b5cf6)",
                padding: "4px 14px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Most Popular
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Pro Trader</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", minHeight: "40px" }}>
              The complete quant edge: Multi-dimensional reports, playbooks, and leakage ledgers.
            </p>
            <div style={{ margin: "20px 0" }}>
              <span style={{ fontSize: "36px", fontWeight: 800 }}>
                ${billingInterval === "yearly" ? "39" : "49"}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}> / month</span>
            </div>
            <Link href="/register?plan=pro">
              <Button variant="primary" style={{ width: "100%", marginBottom: "20px" }}>
                Start 14-Day Free Pro Trial
              </Button>
            </Link>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div>✓ <strong>10 Connected Accounts</strong> (Prop + Live)</div>
              <div>✓ 1,000 Trades / month</div>
              <div>✓ <strong>7-Dimensional Quant Analytics</strong></div>
              <div>✓ <strong>Mistake Leakage & Cost Ledger</strong></div>
              <div>✓ <strong>Strategy Playbooks & Win Rates</strong></div>
              <div>✓ Candlestick Replay Canvas</div>
            </div>
          </div>

          {/* Elite Card */}
          <div className={styles.featureCard}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Elite Institutional</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", minHeight: "40px" }}>
              For full-time prop traders, proprietary funds, and high-frequency specialists.
            </p>
            <div style={{ margin: "20px 0" }}>
              <span style={{ fontSize: "36px", fontWeight: 800 }}>
                ${billingInterval === "yearly" ? "63" : "79"}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}> / month</span>
            </div>
            <Link href="/register?plan=elite">
              <Button variant="outline" style={{ width: "100%", marginBottom: "20px" }}>
                Upgrade to Elite
              </Button>
            </Link>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div>✓ <strong>50 Connected Accounts</strong></div>
              <div>✓ 50,000 Trades / month</div>
              <div>✓ <strong>AI Trade Mentor & Debriefs</strong></div>
              <div>✓ Custom API & Broker Webhooks</div>
              <div>✓ Priority 24/7 Ticketing Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Trader Verified</span>
          <h2 className={styles.sectionTitle}>What Serious Traders Are Saying</h2>
        </div>

        <div className={`${styles.testimonialsGrid} max-w-7xl mx-auto px-6`}>
          <div className={styles.testimonialCard}>
            <div style={{ color: "#f59e0b", fontSize: "14px" }}>★★★★★</div>
            <p className={styles.testimonialQuote}>
              "TradePulse's Mistake Leakage ledger opened my eyes. I discovered that breaking my stop-loss
              rules cost me over $4,200 last month. Once I saw the exact dollar figure, my discipline snapped
              into place. Passed my Apex 150k funded account two weeks later."
            </p>
            <div className={styles.authorRow}>
              <div className={styles.authorAvatar}>SC</div>
              <div>
                <div className={styles.authorName}>Sarah Chen</div>
                <div className={styles.authorRole}>Funded Prop Trader (ES / NQ Futures)</div>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div style={{ color: "#f59e0b", fontSize: "14px" }}>★★★★★</div>
            <p className={styles.testimonialQuote}>
              "The automated CSV importer from Tradovate and ThinkorSwim is flawless. It matches scale-ins,
              computes weighted entry prices, and deducts contract commissions without breaking a sweat.
              Hands down the slickest journal platform on the market."
            </p>
            <div className={styles.authorRow}>
              <div className={styles.authorAvatar}>MA</div>
              <div>
                <div className={styles.authorName}>Marcus Aurelius</div>
                <div className={styles.authorRole}>Quantitative Equities Day Trader</div>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div style={{ color: "#f59e0b", fontSize: "14px" }}>★★★★★</div>
            <p className={styles.testimonialQuote}>
              "The 7-dimensional analytics showed me that my London session breakout setup had an 82% win rate,
              while my NY afternoon trades were bleeding capital. By simply cutting my afternoon trades,
              my monthly P&L went positive. Incredible product."
            </p>
            <div className={styles.authorRow}>
              <div className={styles.authorAvatar}>ER</div>
              <div>
                <div className={styles.authorName}>Elena Rostova</div>
                <div className={styles.authorRole}>Full-Time FX & Commodities Trader</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className={`${styles.featuresSection} max-w-7xl mx-auto px-6`}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Got Questions?</span>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        </div>

        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  cursor: "pointer",
                }}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {faq.q}
                  </h4>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {isOpen && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--color-text-secondary)",
                      marginTop: "12px",
                      lineHeight: 1.6,
                    }}
                  >
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`${styles.footerContainer} max-w-7xl mx-auto px-6`}>
          <div style={{ maxWidth: "340px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div className={styles.brandLogo}>
                <TrendingUp size={18} />
              </div>
              <span className={styles.brandName}>TradePulse</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              The institutional-grade trading journal and analytics platform for disciplined futures,
              equities, and forex traders.
            </p>
          </div>

          <div>
            <h5 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px", color: "var(--color-text-primary)" }}>
              Platform
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/analytics" className={styles.navLink}>Quant Analytics</Link>
              <Link href="/calendar" className={styles.navLink}>Performance Calendar</Link>
              <Link href="/playbooks" className={styles.navLink}>Strategy Playbooks</Link>
              <Link href="/trades/import" className={styles.navLink}>CSV Broker Import</Link>
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px", color: "var(--color-text-primary)" }}>
              Account & Support
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <Link href="/login" className={styles.navLink}>Sign In</Link>
              <Link href="/register" className={styles.navLink}>Create Account</Link>
              <Link href="/billing" className={styles.navLink}>Billing & Pricing</Link>
              <Link href="/admin" className={styles.navLink}>Admin Portal</Link>
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px", color: "var(--color-text-primary)" }}>
              Compliance & Security
            </h5>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--color-text-muted)" }}>
              <div>256-bit SSL Encryption</div>
              <div>Stripe PCI-DSS Level 1</div>
              <div>Strict Multi-Tenant Scoping</div>
              <div>CFTC Rule 4.41 Compliant</div>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div>© 2026 TradePulse Technologies Inc. All rights reserved.</div>
          <div style={{ maxWidth: "600px", textAlign: "right" }}>
            CFTC Rule 4.41: Hypothetical or simulated performance results have certain limitations.
            Trading futures, options, and equities involves substantial risk of loss.
          </div>
        </div>
      </footer>
    </div>
  );
}
