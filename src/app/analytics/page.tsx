"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Analytics.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { TradingAccount } from "@/types";
import { QuantitativeReport, DimensionMetric } from "@/lib/analytics/reporting-service";
import {
  Clock,
  Calendar,
  Layers,
  Workflow,
  Hourglass,
  AlertOctagon,
  TrendingUp,
  BarChart3,
  Award,
  Zap,
} from "lucide-react";

export default function AnalyticsPage() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "ytd" | "1y" | "all">("30d");

  const [report, setReport] = useState<QuantitativeReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "hourly" | "days" | "symbols" | "playbooks" | "duration" | "mistakes"
  >("symbols");

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedAccountId, timeRange]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/v1/accounts");
      const json = await res.json();
      if (json.success && json.data) {
        setAccounts(json.data);
      }
    } catch {
      // Ignore
    }
  };

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const url = `/api/v1/analytics/reports?accountId=${selectedAccountId}&timeRange=${timeRange}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setReport(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const renderMetricTable = (metrics: DimensionMetric[], keyColHeader: string) => {
    if (!metrics || metrics.length === 0) {
      return (
        <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-muted)" }}>
          No closed trade records found for this category.
        </div>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{keyColHeader}</th>
              <th>Trades</th>
              <th>Win Rate</th>
              <th>Net P&L</th>
              <th>Profit Factor</th>
              <th>Avg Trade</th>
              <th>Avg Win</th>
              <th>Avg Loss</th>
              <th>Commissions</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((row) => {
              const isProfit = row.netPnl >= 0;
              return (
                <tr key={row.key}>
                  <td><strong>{row.label}</strong></td>
                  <td>{row.tradeCount}</td>
                  <td>
                    <div className={styles.winRateBarWrapper}>
                      <div className={styles.winRateBarTrack}>
                        <div
                          className={styles.winRateBarFill}
                          style={{
                            width: `${row.winRate}%`,
                            background: row.winRate >= 50 ? "var(--brand-emerald)" : "var(--brand-crimson)",
                          }}
                        />
                      </div>
                      <span className={styles.winRateText}>{row.winRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: isProfit ? "var(--brand-emerald)" : "var(--brand-crimson)" }}>
                      {isProfit ? "+" : ""}${row.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td>
                    {row.profitFactor >= 999 ? "∞" : row.profitFactor.toFixed(2)}
                  </td>
                  <td>${row.avgTrade.toFixed(2)}</td>
                  <td style={{ color: "var(--brand-emerald)" }}>+${row.avgWinner.toFixed(2)}</td>
                  <td style={{ color: "var(--brand-crimson)" }}>-${row.avgLoser.toFixed(2)}</td>
                  <td>${row.totalFees.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Quantitative Analytics & Performance Reports</h1>
            <p className={styles.subtitle}>
              Uncover multi-dimensional statistical edges across market timing, instruments, strategy playbooks, and discipline
            </p>
          </div>
          <div>
            <Link href="/dashboard">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className={styles.controlsBar}>
          <div style={{ width: "260px" }}>
            <Select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              options={[
                { value: "all", label: "All Trading Accounts" },
                ...accounts.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.brokerName})`,
                })),
              ]}
            />
          </div>

          <div className={styles.segmentedControl}>
            {(["7d", "30d", "90d", "ytd", "1y", "all"] as const).map((r) => (
              <button
                key={r}
                className={`${styles.segmentBtn} ${timeRange === r ? styles.segmentBtnActive : ""}`}
                onClick={() => setTimeRange(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Key Edge Highlights */}
        {report && (
          <div className={styles.highlightsGrid}>
            <div className={styles.highlightCard}>
              <span className={styles.highlightLabel}>Top Instrument</span>
              <span className={styles.highlightValue}>{report.summary.bestSymbol}</span>
              <span className={styles.highlightSub}>Highest net profitability</span>
            </div>

            <div className={styles.highlightCard}>
              <span className={styles.highlightLabel}>Best Market Timing</span>
              <span className={styles.highlightValue}>{report.summary.bestHour}</span>
              <span className={styles.highlightSub}>Peak execution hour</span>
            </div>

            <div className={styles.highlightCard}>
              <span className={styles.highlightLabel}>Optimal Session</span>
              <span className={styles.highlightValue}>{report.summary.bestSession}</span>
              <span className={styles.highlightSub}>Highest win probability</span>
            </div>

            <div className={styles.highlightCard}>
              <span className={styles.highlightLabel}>Top Playbook Strategy</span>
              <span className={styles.highlightValue}>{report.summary.bestPlaybook}</span>
              <span className={styles.highlightSub}>Highest risk-adjusted return</span>
            </div>

            <div className={`${styles.highlightCard} ${styles.leakageCard}`}>
              <span className={styles.highlightLabel}>Discipline Leakage Cost</span>
              <span className={`${styles.highlightValue} ${styles.leakageValue}`}>
                -${report.totalDisciplineCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className={styles.highlightSub}>Losses from logged trading mistakes</span>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === "symbols" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("symbols")}
          >
            <Layers size={15} /> Symbols & Tickers
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "hourly" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("hourly")}
          >
            <Clock size={15} /> Hourly & Sessions
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "days" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("days")}
          >
            <Calendar size={15} /> Days of the Week
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "playbooks" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("playbooks")}
          >
            <Workflow size={15} /> Playbooks & Setups
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "duration" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("duration")}
          >
            <Hourglass size={15} /> Holding Duration
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "mistakes" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("mistakes")}
          >
            <AlertOctagon size={15} /> Mistake Cost Ledger
          </button>
        </div>

        {/* TAB 1: Symbols & Tickers */}
        {activeTab === "symbols" && report && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Symbol & Contract Leaderboard</h2>
              <Badge variant="primary">{report.symbolDistribution.length} Instruments Traded</Badge>
            </div>
            {renderMetricTable(report.symbolDistribution, "Ticker / Contract")}
          </div>
        )}

        {/* TAB 2: Hourly & Market Sessions */}
        {activeTab === "hourly" && report && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Market Session Breakdown</h2>
                <Badge variant="info">Time of Day Edge</Badge>
              </div>
              {renderMetricTable(report.sessionDistribution, "Market Session")}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Hourly Distribution (UTC / Market Hours)</h2>
              </div>
              {renderMetricTable(report.hourlyDistribution, "Hour (UTC)")}
            </div>
          </div>
        )}

        {/* TAB 3: Days of the Week */}
        {activeTab === "days" && report && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Day of the Week Edge & Consistency</h2>
              <Badge variant="neutral">Monday - Friday</Badge>
            </div>
            {renderMetricTable(report.dayOfWeekDistribution, "Day of the Week")}
          </div>
        )}

        {/* TAB 4: Playbooks & Setups */}
        {activeTab === "playbooks" && report && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Playbook Strategy Comparison</h2>
              <Badge variant="profit">{report.playbookDistribution.length} Setups Evaluated</Badge>
            </div>
            {renderMetricTable(report.playbookDistribution, "Playbook Strategy")}
          </div>
        )}

        {/* TAB 5: Holding Duration */}
        {activeTab === "duration" && report && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Holding Duration vs Profitability</h2>
              <Badge variant="info">Scalp to Swing</Badge>
            </div>
            {renderMetricTable(report.durationDistribution, "Duration Bucket")}
          </div>
        )}

        {/* TAB 6: Mistake Cost Ledger */}
        {activeTab === "mistakes" && report && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Trading Mistake Cost Ledger</h2>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>
                  Quantifies the direct financial impact of discipline breaches and emotional trading errors.
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Total Leakage
                </span>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--brand-crimson)" }}>
                  -${report.totalDisciplineCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {report.mistakeCostLedger.length === 0 ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-muted)" }}>
                <Award size={36} style={{ margin: "0 auto var(--space-2)", color: "var(--brand-emerald)" }} />
                <p>No discipline mistakes recorded in this period. Outstanding emotional execution!</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mistake Type / Tag</th>
                      <th>Occurrences</th>
                      <th>Total Loss Attributed</th>
                      <th>Avg Loss Per Breach</th>
                      <th>Largest Single Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.mistakeCostLedger.map((m) => (
                      <tr key={m.tagValue}>
                        <td>
                          <Badge variant="loss">{m.tagValue}</Badge>
                        </td>
                        <td><strong>{m.occurrenceCount}</strong> times</td>
                        <td>
                          <strong style={{ color: "var(--brand-crimson)" }}>
                            -${m.totalLossAttributed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td>-${m.avgLossPerMistake.toFixed(2)}</td>
                        <td>-${m.largestLoss.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
