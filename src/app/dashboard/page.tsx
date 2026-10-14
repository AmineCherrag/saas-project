"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Dashboard.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AddTradeModal } from "@/components/trades/AddTradeModal";
import { EquityCurveChart } from "@/components/analytics/EquityCurveChart";
import { DailyPnlBarChart } from "@/components/analytics/DailyPnlBarChart";
import { WinLossDonut } from "@/components/analytics/WinLossDonut";
import {
  TrendingUp,
  Target,
  Scale,
  Award,
  ArrowDownRight,
  Receipt,
  Plus,
  UploadCloud,
  Calendar,
  Sparkles,
  ExternalLink,
  LineChart,
  BarChart2,
  PieChart,
} from "lucide-react";
import { Trade, TradingAccount } from "@/types";
import { ExecutiveDashboardData } from "@/lib/analytics/analytics-service";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "ytd" | "1y" | "all">("30d");

  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<"equity" | "pnl">("equity");

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchDashboardAnalytics();
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

  const fetchDashboardAnalytics = async () => {
    setIsLoading(true);
    try {
      const url = `/api/v1/analytics/dashboard?accountId=${selectedAccountId}&timeRange=${timeRange}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setDashboardData(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<Trade>[] = [
    {
      key: "symbol",
      header: "Instrument",
      render: (trade) => (
        <div className={styles.symbolCell}>
          <span className={styles.symbolName}>{trade.symbol}</span>
          <span className={styles.accountBadge}>{trade.accountName || "Account"}</span>
        </div>
      ),
    },
    {
      key: "direction",
      header: "Side",
      align: "center",
      render: (trade) => (
        <Badge
          variant={trade.direction === "LONG" ? "profit" : "loss"}
          size="sm"
        >
          {trade.direction}
        </Badge>
      ),
    },
    {
      key: "entryPrice",
      header: "Entry Price",
      align: "right",
      render: (trade) => `$${trade.entryPrice.toLocaleString("en-US")}`,
    },
    {
      key: "exitPrice",
      header: "Exit Price",
      align: "right",
      render: (trade) =>
        trade.exitPrice ? `$${trade.exitPrice.toLocaleString("en-US")}` : "Open",
    },
    {
      key: "quantity",
      header: "Size",
      align: "right",
      render: (trade) => trade.quantity,
    },
    {
      key: "netPnl",
      header: "Net P&L",
      align: "right",
      render: (trade) => {
        const isProfitable = trade.netPnl >= 0;
        return (
          <span className={isProfitable ? styles.pnlProfit : styles.pnlLoss}>
            {isProfitable ? "+" : ""}$
            {trade.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: "rMultiple",
      header: "R-Multiple",
      align: "right",
      render: (trade) => (
        <span
          className={
            trade.rMultiple && trade.rMultiple > 0
              ? styles.pnlProfit
              : styles.pnlLoss
          }
        >
          {trade.rMultiple ? `${trade.rMultiple.toFixed(2)} R` : "—"}
        </span>
      ),
    },
    {
      key: "entryTime",
      header: "Timestamp",
      align: "right",
      render: (trade) => (
        <span className={styles.timestampCell}>
          {new Date(trade.entryTime).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Details",
      align: "center",
      render: (trade) => (
        <Link href={`/trades/${trade.id}`}>
          <Button variant="ghost" size="sm">
            Inspect <ExternalLink size={12} style={{ marginLeft: "4px" }} />
          </Button>
        </Link>
      ),
    },
  ];

  const m = dashboardData?.metrics;

  return (
    <AppShell>
      {/* Welcome Banner */}
      <section className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <div className={styles.pillTag}>
            <Sparkles size={13} className={styles.sparkleIcon} />
            <span>EXECUTIVE TRADING ANALYTICS</span>
          </div>
          <h1 className={styles.heading}>Performance Dashboard</h1>
          <p className={styles.subheading}>
            Comprehensive trade intelligence, equity curves, risk multiples, and calendar consistency tracking.
          </p>
        </div>

        <div className={styles.bannerActions}>
          <Link href="/trades/import">
            <Button variant="secondary" size="md">
              <UploadCloud size={16} style={{ marginRight: "6px" }} />
              Import Broker CSV
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} style={{ marginRight: "6px" }} />
            Log New Trade
          </Button>
        </div>
      </section>

      {/* Filter Controls Bar */}
      <section className={styles.controlsBar}>
        <div className={styles.filterGroup}>
          <div style={{ width: "240px" }}>
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
      </section>

      {/* Primary KPI Metrics Grid */}
      <section className={styles.metricsGrid}>
        <StatCard
          title="Net Profit & Loss"
          value={
            m
              ? `${m.netPnl >= 0 ? "+" : ""}$${m.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : "—"
          }
          subtitle={m ? `After $${m.totalFees.toFixed(2)} in commissions` : "Calculating..."}
          icon={<TrendingUp size={18} />}
          variant={m && m.netPnl >= 0 ? "profit" : "loss"}
        />
        <StatCard
          title="Win Rate %"
          value={m ? `${m.winRate.toFixed(1)}%` : "—"}
          subtitle={m ? `${m.winningTrades} wins / ${m.losingTrades} losses (${m.totalTrades} total)` : ""}
          icon={<Target size={18} />}
          variant="default"
        />
        <StatCard
          title="Profit Factor"
          value={m ? (m.profitFactor >= 999 ? "∞" : m.profitFactor.toFixed(2)) : "—"}
          subtitle={m ? `Expectancy: $${m.expectancy.toFixed(2)} / trade` : ""}
          icon={<Scale size={18} />}
          variant={m && m.profitFactor >= 1.5 ? "profit" : "default"}
        />
        <StatCard
          title="Average R-Multiple"
          value={m ? `${m.avgRMultiple >= 0 ? "+" : ""}${m.avgRMultiple.toFixed(2)} R` : "—"}
          subtitle={m ? `Avg Win: $${m.avgWinner.toFixed(0)} | Avg Loss: $${m.avgLoser.toFixed(0)}` : ""}
          icon={<Award size={18} />}
          variant="primary"
        />
      </section>

      {/* Secondary Metrics Row */}
      <section className={styles.secondaryGrid}>
        <StatCard
          title="Maximum Drawdown"
          value={m ? `-$${m.maxDrawdown.toFixed(2)}` : "—"}
          subtitle={m ? `${m.maxDrawdownPct.toFixed(1)}% peak-to-trough` : ""}
          icon={<ArrowDownRight size={18} />}
          variant="loss"
        />
        <StatCard
          title="Commissions & Fees"
          value={m ? `-$${m.totalFees.toFixed(2)}` : "—"}
          subtitle={m && m.totalTrades > 0 ? `Avg $${(m.totalFees / m.totalTrades).toFixed(2)} / trade` : ""}
          icon={<Receipt size={18} />}
          variant="default"
        />
        <StatCard
          title="Long Trade Win Rate"
          value={dashboardData ? `${dashboardData.longStats.winRate.toFixed(1)}%` : "—"}
          subtitle={dashboardData ? `${dashboardData.longStats.tradeCount} trades (+$${dashboardData.longStats.netPnl.toFixed(0)} net)` : ""}
          variant="profit"
        />
        <StatCard
          title="Short Trade Win Rate"
          value={dashboardData ? `${dashboardData.shortStats.winRate.toFixed(1)}%` : "—"}
          subtitle={dashboardData ? `${dashboardData.shortStats.tradeCount} trades (+$${dashboardData.shortStats.netPnl.toFixed(0)} net)` : ""}
          variant="default"
        />
      </section>

      {/* Interactive Visualizations Section */}
      <section className={styles.chartsSection}>
        {/* Main Chart Card (Equity Curve & Daily PnL Bar Chart) */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>
              {activeChartTab === "equity" ? "Cumulative Equity Curve" : "Daily Realized P&L"}
            </span>
            <div className={styles.chartTabs}>
              <button
                className={`${styles.chartTabBtn} ${activeChartTab === "equity" ? styles.chartTabBtnActive : ""}`}
                onClick={() => setActiveChartTab("equity")}
              >
                <LineChart size={13} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                Equity Curve
              </button>
              <button
                className={`${styles.chartTabBtn} ${activeChartTab === "pnl" ? styles.chartTabBtnActive : ""}`}
                onClick={() => setActiveChartTab("pnl")}
              >
                <BarChart2 size={13} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                Daily P&L Bars
              </button>
            </div>
          </div>

          {activeChartTab === "equity" ? (
            <EquityCurveChart data={dashboardData?.equityCurve || []} height={280} />
          ) : (
            <DailyPnlBarChart data={dashboardData?.dailyPnlSeries || []} height={280} />
          )}
        </div>

        {/* Win/Loss Distribution & Calendar Shortcut */}
        <div className={styles.calendarWidget}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <span className={styles.chartTitle}>Trade Outcome Distribution</span>
              <PieChart size={16} color="var(--brand-blue)" />
            </div>
            <div className={styles.donutWrapper}>
              <WinLossDonut
                wins={m?.winningTrades || 0}
                losses={m?.losingTrades || 0}
                breakEvens={m?.breakEvenTrades || 0}
                winRate={m?.winRate || 0}
                size={170}
              />
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-4)", marginTop: "var(--space-2)" }}>
            <Link href="/calendar" style={{ textDecoration: "none", width: "100%" }}>
              <Button variant="outline" size="md" style={{ width: "100%" }}>
                <Calendar size={15} style={{ marginRight: "6px" }} />
                Open Interactive Calendar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Trades Table Section */}
      <section className={styles.tradesSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Recent Executed Trades</h2>
            <p className={styles.sectionSubtitle}>
              Latest closed trade records with verified mathematical formulas.
            </p>
          </div>
          <div className={styles.tableControls}>
            <Link href="/calendar">
              <Button variant="outline" size="sm">
                <Calendar size={14} style={{ marginRight: "6px" }} />
                Calendar View
              </Button>
            </Link>
            <Link href="/trades">
              <Button variant="secondary" size="sm">
                View Full Log ({m?.totalTrades || 0})
              </Button>
            </Link>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={dashboardData?.recentTrades || []}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => (window.location.href = `/trades/${item.id}`)}
        />
      </section>

      {/* Add Trade Modal */}
      <AddTradeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTradeCreated={() => {
          setIsAddModalOpen(false);
          fetchDashboardAnalytics();
        }}
        accounts={accounts}
      />
    </AppShell>
  );
}
