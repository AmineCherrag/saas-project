"use client";

import React, { useState, useEffect } from "react";
import styles from "./Billing.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  CreditCard,
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  Download,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Layers,
  Lock,
} from "lucide-react";
import { SubscriptionPlan, UserSubscription, InvoiceRecord } from "@/types";

export default function BillingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(true);

  // Checkout modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Portal & Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch plans
      const plansRes = await fetch("/api/v1/billing/plans");
      const plansData = await plansRes.json();
      if (plansData.success) {
        setPlans(plansData.data);
      }

      // 2. Fetch user subscription & invoices
      const subRes = await fetch("/api/v1/billing/subscription");
      const subData = await subRes.json();
      if (subData.success) {
        setSubscription(subData.data.subscription);
        setInvoices(subData.data.invoices || []);
        if (subData.data.subscription?.billingInterval) {
          setInterval(subData.data.subscription.billingInterval);
        }
      }
    } catch (err) {
      console.error("Failed to load billing data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCheckout = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setCheckoutModalOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: selectedPlan.slug,
          interval,
          directUpgrade: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubscription(data.data.subscription);
        if (data.data.invoice) {
          setInvoices((prev) => [data.data.invoice, ...prev]);
        }
        setStatusMessage(`Successfully upgraded to ${selectedPlan.name}!`);
        setTimeout(() => {
          setCheckoutModalOpen(false);
          setStatusMessage(null);
        }, 1200);
      } else {
        setStatusMessage(data.error?.message || "Checkout failed. Please try again.");
      }
    } catch {
      setStatusMessage("An error occurred during payment processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCancel = async (shouldCancel: boolean) => {
    try {
      const res = await fetch("/api/v1/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel: shouldCancel }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
        setCancelModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to toggle cancel state", err);
    }
  };

  const currentPlanSlug = subscription?.plan?.slug || "pro";

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Subscription & Billing</h1>
            <p>
              Manage your TradePulse subscription plan, view payment receipts, and upgrade your
              analytics capabilities.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCw size={14} />}
              onClick={fetchBillingData}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Active Plan Overview Card */}
        {subscription && (
          <div className={styles.currentSubCard}>
            <div className={styles.subCardTop}>
              <div className={styles.subDetails}>
                <div className={styles.subIconBox}>
                  <Zap size={28} />
                </div>
                <div className={styles.subMeta}>
                  <h3>
                    {subscription.plan.name}
                    <Badge
                      variant={
                        subscription.status === "ACTIVE"
                          ? "success"
                          : subscription.status === "TRIALING"
                          ? "info"
                          : "danger"
                      }
                    >
                      {subscription.status}
                    </Badge>
                    {subscription.cancelAtPeriodEnd && (
                      <Badge variant="warning">Cancels at Period End</Badge>
                    )}
                  </h3>
                  <p>
                    Billed {subscription.billingInterval} • Current period ends{" "}
                    <strong>
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                  </p>
                </div>
              </div>

              <div className={styles.subCardActions}>
                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleCancel(false)}
                  >
                    Resume Subscription
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel Plan
                  </Button>
                )}
              </div>
            </div>

            {/* Quota / Usage meters */}
            <div className={styles.usageGrid}>
              <div className={styles.usageItem}>
                <div className={styles.usageHeader}>
                  <span className={styles.usageLabel}>Trading Accounts</span>
                  <span className={styles.usageValue}>
                    3 / {subscription.plan.maxAccounts} Accounts
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${Math.min(100, (3 / subscription.plan.maxAccounts) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className={styles.usageItem}>
                <div className={styles.usageHeader}>
                  <span className={styles.usageLabel}>Monthly Trades</span>
                  <span className={styles.usageValue}>
                    42 / {subscription.plan.maxTradesPerMonth.toLocaleString("en-US")} Trades
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: `${Math.min(
                        100,
                        (42 / subscription.plan.maxTradesPerMonth) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className={styles.usageItem}>
                <div className={styles.usageHeader}>
                  <span className={styles.usageLabel}>Advanced Analytics</span>
                  <span className={styles.usageValue}>
                    {subscription.plan.hasAdvancedAnalytics ? "Unlocked" : "Locked (Pro+)"}
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: subscription.plan.hasAdvancedAnalytics ? "100%" : "0%",
                    }}
                  />
                </div>
              </div>

              <div className={styles.usageItem}>
                <div className={styles.usageHeader}>
                  <span className={styles.usageLabel}>Strategy Playbooks</span>
                  <span className={styles.usageValue}>
                    {subscription.plan.hasPlaybooks ? "Unlocked" : "Locked (Pro+)"}
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={styles.progressBarFill}
                    style={{
                      width: subscription.plan.hasPlaybooks ? "100%" : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Switcher */}
        <div className={styles.pricingHeader}>
          <h2>Available Subscription Tiers</h2>
          <p>Choose the level of analytical firepower that matches your trading scale.</p>

          <div className={styles.intervalToggleContainer}>
            <button
              className={`${styles.intervalBtn} ${
                interval === "monthly" ? styles.intervalBtnActive : ""
              }`}
              onClick={() => setInterval("monthly")}
            >
              Monthly Billed
            </button>
            <button
              className={`${styles.intervalBtn} ${
                interval === "yearly" ? styles.intervalBtnActive : ""
              }`}
              onClick={() => setInterval("yearly")}
            >
              Annual Billed
            </button>
            <span className={styles.discountBadge}>20% Off</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className={styles.plansGrid}>
          {plans.map((p) => {
            const isCurrent = currentPlanSlug === p.slug;
            const isFeatured = p.slug === "pro";
            const price = interval === "yearly" ? Math.round(p.priceYearly / 12) : p.priceMonthly;

            return (
              <div
                key={p.id}
                className={`${styles.planCard} ${isFeatured ? styles.planCardFeatured : ""}`}
              >
                {isFeatured && <div className={styles.popularPill}>Most Popular</div>}

                <div className={styles.planHeader}>
                  <h3 className={styles.planName}>{p.name}</h3>
                  <p className={styles.planDesc}>
                    {p.slug === "starter" &&
                      "Perfect for developing traders looking to eliminate emotional leaks and maintain a clean journal."}
                    {p.slug === "pro" &&
                      "The ultimate analytical edge with multi-dimensional breakdowns and strategy playbooks."}
                    {p.slug === "elite" &&
                      "Institutional-grade infrastructure with AI Mentor and unlimited automated imports."}
                  </p>
                </div>

                <div className={styles.priceWrapper}>
                  <span className={styles.priceAmount}>${price}</span>
                  <span className={styles.pricePeriod}>/ month</span>
                </div>

                <div className={styles.planActionBtn}>
                  {isCurrent ? (
                    <Button variant="outline" style={{ width: "100%" }} disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={isFeatured ? "primary" : "secondary"}
                      style={{ width: "100%" }}
                      rightIcon={<ArrowRight size={16} />}
                      onClick={() => handleOpenCheckout(p)}
                    >
                      {p.slug === "elite" ? "Upgrade to Elite" : `Switch to ${p.name}`}
                    </Button>
                  )}
                </div>

                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <Check size={16} className={styles.featureCheck} />
                    <span>
                      Up to <strong>{p.maxAccounts}</strong> connected trading accounts
                    </span>
                  </div>
                  <div className={styles.featureItem}>
                    <Check size={16} className={styles.featureCheck} />
                    <span>
                      Up to <strong>{p.maxTradesPerMonth.toLocaleString("en-US")}</strong> trades / month
                    </span>
                  </div>
                  <div className={styles.featureItem}>
                    <Check size={16} className={styles.featureCheck} />
                    <span>CSV & Automated Broker Importers</span>
                  </div>
                  <div className={styles.featureItem}>
                    {p.hasAdvancedAnalytics ? (
                      <>
                        <Check size={16} className={styles.featureCheck} />
                        <span>7-Dimensional Quantitative Analytics</span>
                      </>
                    ) : (
                      <>
                        <X size={16} className={styles.featureCross} />
                        <span className={styles.featureDisabled}>
                          7-Dimensional Quantitative Analytics
                        </span>
                      </>
                    )}
                  </div>
                  <div className={styles.featureItem}>
                    {p.hasPlaybooks ? (
                      <>
                        <Check size={16} className={styles.featureCheck} />
                        <span>Strategy Playbooks & Setup Win Rates</span>
                      </>
                    ) : (
                      <>
                        <X size={16} className={styles.featureCross} />
                        <span className={styles.featureDisabled}>Strategy Playbooks</span>
                      </>
                    )}
                  </div>
                  <div className={styles.featureItem}>
                    {p.hasReplay ? (
                      <>
                        <Check size={16} className={styles.featureCheck} />
                        <span>Interactive Replay & Candlestick Canvas</span>
                      </>
                    ) : (
                      <>
                        <X size={16} className={styles.featureCross} />
                        <span className={styles.featureDisabled}>Candlestick Replay Canvas</span>
                      </>
                    )}
                  </div>
                  <div className={styles.featureItem}>
                    {p.hasAiMentor ? (
                      <>
                        <Check size={16} className={styles.featureCheck} />
                        <span>AI Trade Mentor & Psychology Debriefs</span>
                      </>
                    ) : (
                      <>
                        <X size={16} className={styles.featureCross} />
                        <span className={styles.featureDisabled}>AI Trade Mentor</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoice & Payment History */}
        <div className={styles.invoicesSection}>
          <div className={styles.sectionHeader}>
            <h3>Invoice History</h3>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Processed securely via Stripe Payments
            </span>
          </div>

          {invoices.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "var(--spacing-8)",
                color: "var(--color-text-secondary)",
              }}
            >
              No past billing invoices recorded yet.
            </div>
          ) : (
            <table className={styles.invoicesTable}>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{inv.id}</td>
                    <td>{new Date(inv.date).toLocaleDateString("en-US")}</td>
                    <td>{inv.planName}</td>
                    <td style={{ fontWeight: 600 }}>${inv.amount.toFixed(2)} USD</td>
                    <td>
                      <Badge variant={inv.status === "PAID" ? "success" : "danger"}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className={styles.downloadLink}
                        onClick={() =>
                          alert(`Simulated invoice PDF download for ${inv.id} ($${inv.amount.toFixed(2)})`)
                        }
                      >
                        <Download size={14} /> PDF Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Stripe Checkout Simulation Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title={`Upgrade to ${selectedPlan?.name || "Plan"}`}
        maxWidth="md"
      >
        <div className={styles.checkoutModalBody}>
          <div className={styles.cardPreviewBox}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={16} color="var(--color-primary-400)" />
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  256-bit Encrypted Stripe Checkout
                </span>
              </div>
              <Badge variant="info">Test Mode</Badge>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Selected Plan
              </span>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginTop: "2px",
                }}
              >
                {selectedPlan?.name} — $
                {interval === "yearly"
                  ? `${selectedPlan?.priceYearly} / year`
                  : `${selectedPlan?.priceMonthly} / month`}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Card Number
                </label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                />
              </div>

              <div className={styles.cardRow}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Expires
                  </label>
                  <Input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    CVC
                  </label>
                  <Input
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="CVC"
                  />
                </div>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: statusMessage.includes("Successfully")
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
                color: statusMessage.includes("Successfully") ? "#10b981" : "#ef4444",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {statusMessage}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Button
              variant="outline"
              onClick={() => setCheckoutModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmUpgrade}
              isLoading={isProcessing}
              leftIcon={<ShieldCheck size={16} />}
            >
              Confirm & Subscribe
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Subscription"
        maxWidth="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            Are you sure you want to cancel your subscription? You will continue to have access to
            all your premium features until the end of your billing cycle (
            <strong>
              {subscription &&
                new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US")}
            </strong>
            ).
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Keep Plan
            </Button>
            <Button
              variant="danger"
              onClick={() => handleToggleCancel(true)}
              leftIcon={<AlertTriangle size={16} />}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
