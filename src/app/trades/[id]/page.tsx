"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./TradeDetail.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Layers,
  FileText,
  Image as ImageIcon,
  Tag,
  Star,
  Activity,
  Edit2,
  Trash2,
} from "lucide-react";
import { Trade } from "@/types";

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tradeId = params?.id as string;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tradeId) return;
    setIsLoading(true);
    fetch(`/api/v1/trades/${tradeId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setTrade(json.data);
        } else {
          setError(json.error?.message || "Trade record not found or access denied.");
        }
      })
      .catch(() => {
        setError("Failed to load trade record.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [tradeId]);

  const handleDelete = async () => {
    if (confirm("Delete this trade?")) {
      try {
        const res = await fetch(`/api/v1/trades/${tradeId}`, { method: "DELETE" });
        if (res.ok) {
          router.push("/trades");
        } else {
          alert("Failed to delete trade.");
        }
      } catch {
        alert("Failed to delete trade.");
      }
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          Loading trade details...
        </div>
      </AppShell>
    );
  }

  if (error || !trade) {
    return (
      <AppShell>
        <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "var(--color-text-primary)" }}>
            Trade Not Found
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
            {error || "The requested trade does not exist or you do not have permission to view it."}
          </p>
          <Button variant="primary" onClick={() => router.push("/trades")}>
            Return to Trades Log
          </Button>
        </div>
      </AppShell>
    );
  }

  const isProfitable = trade.netPnl >= 0;

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Top Navigation Row */}
        <div className={styles.navRow}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => router.push("/trades")}
          >
            Back to Trades Log
          </Button>

          <div className={styles.topActions}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 size={14} />}
              onClick={() => alert("Edit trade details modal trigger")}
            >
              Edit Trade
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => {
                if (confirm("Delete this trade?")) router.push("/trades");
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Trade Identity Header Card */}
        <section className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.tickerPill}>
              <h1 className={styles.symbolTitle}>{trade.symbol}</h1>
              <Badge
                variant={trade.direction === "LONG" ? "profit" : "loss"}
                size="md"
              >
                {trade.direction}
              </Badge>
              <Badge variant="primary" size="md">
                {trade.assetClass}
              </Badge>
            </div>

            <div className={styles.metaRow}>
              <span>
                <Clock size={13} /> {trade.entryTime} → {trade.exitTime}
              </span>
              <span>•</span>
              <span>Account: {trade.accountName}</span>
              <span>•</span>
              <span>Session: {trade.marketSession}</span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.pnlDisplay}>
              <span className={styles.pnlLabel}>Net Realized P&L</span>
              <div
                className={isProfitable ? styles.pnlValueProfit : styles.pnlValueLoss}
              >
                {isProfitable ? "+" : ""}$
                {trade.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className={styles.rDisplay}>
              <span className={styles.pnlLabel}>R-Multiple</span>
              <div className={styles.rValue}>
                {trade.rMultiple ? `+${trade.rMultiple} R` : "—"}
              </div>
            </div>
          </div>
        </section>

        {/* Dual-Pane Core Grid */}
        <div className={styles.dualPaneGrid}>
          {/* ================= LEFT SECTION: METRICS & EXECUTIONS ================= */}
          <div className={styles.leftSection}>
            {/* 1. Quantitative Statistics Grid */}
            <div className={styles.sectionCard}>
              <h3 className={styles.cardHeaderTitle}>Trade Statistics</h3>

              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Gross P&L</span>
                  <span
                    className={
                      trade.grossPnl >= 0 ? styles.statProfit : styles.statLoss
                    }
                  >
                    +${trade.grossPnl.toFixed(2)}
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Fees & Comm</span>
                  <span className={styles.statDim}>
                    -${(trade.fees + trade.commissions).toFixed(2)}
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Initial Risk</span>
                  <span className={styles.statNeutral}>
                    ${trade.initialRisk ? trade.initialRisk.toFixed(2) : "—"}
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Return %</span>
                  <span className={styles.statProfit}>
                    +{trade.returnPct}%
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Entry Price</span>
                  <span className={styles.statNeutral}>
                    ${trade.entryPrice.toLocaleString("en-US")}
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Exit Price</span>
                  <span className={styles.statNeutral}>
                    ${trade.exitPrice?.toLocaleString("en-US")}
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Stop-Loss</span>
                  <span className={styles.statLoss}>
                    ${trade.stopLoss?.toLocaleString("en-US") || "—"}
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Take-Profit</span>
                  <span className={styles.statProfit}>
                    ${trade.takeProfit?.toLocaleString("en-US") || "—"}
                  </span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Quantity</span>
                  <span className={styles.statNeutral}>{trade.quantity} contracts</span>
                </div>

                <div className={styles.statBox}>
                  <span className={styles.statLabel}>Point Value</span>
                  <span className={styles.statNeutral}>
                    ${trade.contractMultiplier}/pt
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Position Executions Fills */}
            <div className={styles.sectionCard}>
              <h3 className={styles.cardHeaderTitle}>Fills & Order Executions</h3>

              <div className={styles.fillsTableWrapper}>
                <table className={styles.fillsTable}>
                  <thead>
                    <tr>
                      <th>Fill Type</th>
                      <th>Action</th>
                      <th>Time</th>
                      <th style={{ textAlign: "right" }}>Price</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Fees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trade.executions?.map((fill) => (
                      <tr key={fill.id}>
                        <td>
                          <Badge
                            variant={fill.executionType === "ENTRY" ? "primary" : "neutral"}
                            size="sm"
                          >
                            {fill.executionType}
                          </Badge>
                        </td>
                        <td>
                          <span
                            className={
                              fill.orderAction === "BUY"
                                ? styles.fillBuy
                                : styles.fillSell
                            }
                          >
                            {fill.orderAction}
                          </span>
                        </td>
                        <td className={styles.fontMono}>{fill.timestamp}</td>
                        <td className={styles.alignRight}>
                          ${fill.price.toLocaleString("en-US")}
                        </td>
                        <td className={styles.alignRight}>{fill.quantity}</td>
                        <td className={styles.alignRight}>${fill.fees.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Tags & Rating */}
            <div className={styles.sectionCard}>
              <div className={styles.tagsHeader}>
                <h3 className={styles.cardHeaderTitle}>Setup Strategy & Rating</h3>
                <div className={styles.stars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={s <= (trade.rating || 3) ? styles.starOn : styles.starOff}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.tagsContainer}>
                {trade.playbookName && (
                  <Badge variant="primary" size="md">
                    Playbook: {trade.playbookName}
                  </Badge>
                )}
                {trade.tags?.map((t) => (
                  <Badge
                    key={t.id}
                    variant={t.tagType === "MISTAKE" ? "loss" : "neutral"}
                    size="md"
                  >
                    {t.tagValue}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* ================= RIGHT SECTION: CHART & NOTES ================= */}
          <div className={styles.rightSection}>
            {/* 1. Candlestick Visualization with Markers */}
            <div className={styles.sectionCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitleWrapper}>
                  <Activity size={18} className={styles.chartIcon} />
                  <span className={styles.cardHeaderTitle}>Chart Execution Replay</span>
                </div>
                <div className={styles.markerLegend}>
                  <span className={styles.markerEntry}>▲ Entry: $18,250.25</span>
                  <span className={styles.markerExit}>▼ Exit: $18,275.50</span>
                </div>
              </div>

              {/* Simulated Candlestick Canvas View */}
              <div className={styles.candlestickCanvas}>
                <div className={styles.simulatedChart}>
                  {/* Candlesticks visualization bars */}
                  <div className={styles.candleBar} style={{ height: "45%" }}>
                    <div className={styles.wick} />
                    <div className={`${styles.body} ${styles.candleGreen}`} />
                  </div>
                  <div className={styles.candleBar} style={{ height: "35%" }}>
                    <div className={styles.wick} />
                    <div className={`${styles.body} ${styles.candleRed}`} />
                  </div>
                  <div className={styles.candleBar} style={{ height: "55%" }}>
                    <div className={styles.wick} />
                    <div className={`${styles.body} ${styles.candleGreen}`} />
                  </div>
                  <div
                    className={`${styles.candleBar} ${styles.entryCandle}`}
                    style={{ height: "70%" }}
                  >
                    <div className={styles.markerEntryPin}>▲ ENTRY (2 NQ)</div>
                    <div className={styles.wick} />
                    <div className={`${styles.body} ${styles.candleGreen}`} />
                  </div>
                  <div className={styles.candleBar} style={{ height: "80%" }}>
                    <div className={styles.wick} />
                    <div className={`${styles.body} ${styles.candleGreen}`} />
                  </div>
                  <div
                    className={`${styles.candleBar} ${styles.exitCandle}`}
                    style={{ height: "90%" }}
                  >
                    <div className={styles.markerExitPin}>▼ EXIT (+$991.50)</div>
                    <div className={styles.wick} />
                    <div className={`${styles.body} ${styles.candleGreen}`} />
                  </div>
                  <div className={styles.candleBar} style={{ height: "75%" }}>
                    <div className={styles.wick} />
                    <div className={`${styles.body} ${styles.candleRed}`} />
                  </div>
                </div>

                <div className={styles.chartPriceAxis}>
                  <span>18,290.00 (Target)</span>
                  <span className={styles.axisExit}>18,275.50 (Exit)</span>
                  <span className={styles.axisEntry}>18,250.25 (Entry)</span>
                  <span className={styles.axisStop}>18,230.00 (Stop)</span>
                </div>
              </div>
            </div>

            {/* 2. Running P&L Curve */}
            <div className={styles.sectionCard}>
              <h3 className={styles.cardHeaderTitle}>Running Trade Realized P&L</h3>
              <div className={styles.runningPnlProgress}>
                <div className={styles.runningPnlBar} style={{ width: "100%" }}>
                  <span>+$991.50 (+1.22 R Target Hit)</span>
                </div>
              </div>
            </div>

            {/* 3. Trade Notes & Psychology Reflection */}
            <div className={styles.sectionCard}>
              <div className={styles.notesHeader}>
                <FileText size={18} className={styles.cardIcon} />
                <h3 className={styles.cardHeaderTitle}>Execution Thesis & Day Notes</h3>
              </div>
              <div className={styles.notesContent}>
                <p>{trade.notes}</p>
              </div>
            </div>

            {/* 4. Chart Screenshots & Attachments */}
            <div className={styles.sectionCard}>
              <div className={styles.notesHeader}>
                <ImageIcon size={18} className={styles.cardIcon} />
                <h3 className={styles.cardHeaderTitle}>Chart Screenshots & Files</h3>
              </div>
              <div className={styles.attachmentsGrid}>
                <div className={styles.attachmentThumbnail}>
                  <div className={styles.thumbPlaceholder}>
                    <Activity size={24} color="var(--accent-primary)" />
                    <span>5-Min Setup Trigger.png</span>
                  </div>
                </div>
                <div className={styles.attachmentThumbnail}>
                  <div className={styles.thumbPlaceholder}>
                    <Calendar size={24} color="var(--accent-secondary)" />
                    <span>Daily Order Flow Context.png</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
