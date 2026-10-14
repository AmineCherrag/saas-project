"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Calendar.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { TradingAccount, Trade } from "@/types";
import { CalendarMonthData } from "@/lib/analytics/analytics-service";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
} from "lucide-react";

export default function PerformanceCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  const [calendarData, setCalendarData] = useState<CalendarMonthData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDayTrades, setSelectedDayTrades] = useState<{
    date: string;
    netPnl: number;
    trades: Trade[];
  } | null>(null);

  // Month formatted as YYYY-MM
  const yearMonth = `${currentDate.getUTCFullYear()}-${String(
    currentDate.getUTCMonth() + 1
  ).padStart(2, "0")}`;

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch calendar data when month or account changes
  useEffect(() => {
    fetchCalendarData();
  }, [yearMonth, selectedAccountId]);

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

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const url = `/api/v1/analytics/calendar?month=${yearMonth}&accountId=${selectedAccountId}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setCalendarData(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getTime());
      next.setUTCMonth(next.getUTCMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getTime());
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build grid with leading blanks and trailing blanks for the 7 columns
  const firstDayOfWeek = calendarData?.days?.[0]?.dayOfWeek || 0;
  const leadingBlanks = Array.from({ length: firstDayOfWeek });

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Interactive Performance Calendar</h1>
            <p className={styles.subtitle}>
              Inspect daily trading P&L heatmaps, consistency streaks, and drill down into individual day executions
            </p>
          </div>

          <div className={styles.headerControls}>
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

            <div className={styles.monthNavigator}>
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft size={16} />
              </Button>
              <span className={styles.monthTitle}>
                {calendarData?.monthName || "Loading..."}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight size={16} />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={handleToday}>
              Current Month
            </Button>
          </div>
        </div>

        {/* Monthly Summary KPI Cards */}
        {calendarData && (
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Monthly Net P&L</span>
              <span
                className={styles.summaryValue}
                style={{
                  color:
                    calendarData.monthSummary.netPnl >= 0
                      ? "var(--brand-emerald)"
                      : "var(--brand-crimson)",
                }}
              >
                {calendarData.monthSummary.netPnl >= 0 ? "+" : ""}
                ${calendarData.monthSummary.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className={styles.summarySubtext}>
                Gross: ${calendarData.monthSummary.grossPnl.toFixed(2)} • Fees: ${calendarData.monthSummary.fees.toFixed(2)}
              </span>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Trading Activity</span>
              <span className={styles.summaryValue}>
                {calendarData.monthSummary.tradingDays} Days
              </span>
              <span className={styles.summarySubtext}>
                {calendarData.monthSummary.totalTrades} Total Closed Trades
              </span>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Day Consistency Ratio</span>
              <span
                className={styles.summaryValue}
                style={{
                  color:
                    calendarData.monthSummary.dayWinRate >= 50
                      ? "var(--brand-emerald)"
                      : "var(--brand-crimson)",
                }}
              >
                {calendarData.monthSummary.dayWinRate.toFixed(1)}%
              </span>
              <span className={styles.summarySubtext}>
                {calendarData.monthSummary.greenDays} Green / {calendarData.monthSummary.redDays} Red Days
              </span>
            </div>

            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Best / Worst Day</span>
              <span className={styles.summaryValue} style={{ fontSize: "16px", marginTop: "4px" }}>
                <span style={{ color: "var(--brand-emerald)" }}>
                  {calendarData.monthSummary.bestDay
                    ? `+$${calendarData.monthSummary.bestDay.netPnl.toFixed(2)}`
                    : "—"}
                </span>
                {" / "}
                <span style={{ color: "var(--brand-crimson)" }}>
                  {calendarData.monthSummary.worstDay
                    ? `-$${Math.abs(calendarData.monthSummary.worstDay.netPnl).toFixed(2)}`
                    : "—"}
                </span>
              </span>
              <span className={styles.summarySubtext}>
                {calendarData.monthSummary.bestDay?.date || "No trades"}
              </span>
            </div>
          </div>
        )}

        {/* 7-Column Calendar Grid + Weekly Rollups */}
        <div className={styles.calendarWrapper}>
          <div className={styles.calendarGrid}>
            {/* Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div key={dayName} className={styles.dayHeader}>
                {dayName}
              </div>
            ))}
            <div className={styles.weekSummaryHeader}>Weekly Rollup</div>

            {/* Days in Month with Weekly Breakdowns */}
            {calendarData && (
              <>
                {/* Leading inactive blanks before the 1st day */}
                {leadingBlanks.map((_, i) => (
                  <div key={`blank_${i}`} className={`${styles.dayCell} ${styles.dayCellInactive}`} />
                ))}

                {/* Days of the month */}
                {calendarData.days.map((day, idx) => {
                  const hasTrades = day.tradeCount > 0;
                  const isGreen = day.netPnl > 0;
                  const isRed = day.netPnl < 0;

                  const cellClass = `${styles.dayCell} ${
                    hasTrades ? (isGreen ? styles.dayCellGreen : isRed ? styles.dayCellRed : "") : ""
                  }`;

                  return (
                    <React.Fragment key={day.date}>
                      <div
                        className={cellClass}
                        onClick={() => {
                          if (hasTrades) {
                            setSelectedDayTrades({
                              date: day.date,
                              netPnl: day.netPnl,
                              trades: day.trades,
                            });
                          }
                        }}
                      >
                        <div className={styles.dayCellHeader}>
                          <span className={styles.dayNum}>{day.dayNumber}</span>
                          {hasTrades && (
                            <Badge variant={isGreen ? "profit" : isRed ? "loss" : "neutral"} size="sm">
                              {day.winRate.toFixed(0)}%
                            </Badge>
                          )}
                        </div>

                        {hasTrades ? (
                          <>
                            <div className={`${styles.dayPnl} ${isGreen ? styles.pnlGreen : isRed ? styles.pnlRed : ""}`}>
                              {day.netPnl >= 0 ? "+" : ""}${day.netPnl.toFixed(2)}
                            </div>
                            <div className={styles.dayPills}>
                              <span>{day.tradeCount} trade{day.tradeCount === 1 ? "" : "s"}</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ height: "40px" }} />
                        )}
                      </div>

                      {/* If Saturday (dayOfWeek === 6) or last day of month, insert weekly summary */}
                      {(day.dayOfWeek === 6 || idx === calendarData.days.length - 1) && (
                        (() => {
                          // Find corresponding week summary
                          const week = calendarData.weeklySummaries.find(
                            (w) => new Date(day.date) >= new Date(w.startDate) && new Date(day.date) <= new Date(w.endDate)
                          );

                          return (
                            <div key={`week_summary_${idx}`} className={styles.weekCell}>
                              <div>
                                <span className={styles.weekTitle}>
                                  Week {week?.weekIndex || ""}
                                </span>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                  {week?.tradeCount || 0} trades
                                </div>
                              </div>
                              <div
                                className={styles.weekPnl}
                                style={{
                                  color:
                                    (week?.netPnl || 0) >= 0
                                      ? "var(--brand-emerald)"
                                      : "var(--brand-crimson)",
                                }}
                              >
                                {(week?.netPnl || 0) >= 0 ? "+" : ""}$
                                {(week?.netPnl || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Daily Drilldown Modal */}
        <Modal
          isOpen={!!selectedDayTrades}
          onClose={() => setSelectedDayTrades(null)}
          title={`Daily Drilldown: ${selectedDayTrades?.date || ""}`}
          maxWidth="lg"
        >
          {selectedDayTrades && (
            <div className={styles.drilldownContent}>
              <div className={styles.drilldownStats}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Daily Net P&L
                  </span>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color:
                        selectedDayTrades.netPnl >= 0
                          ? "var(--brand-emerald)"
                          : "var(--brand-crimson)",
                    }}
                  >
                    {selectedDayTrades.netPnl >= 0 ? "+" : ""}$
                    {selectedDayTrades.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Executions Count
                  </span>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {selectedDayTrades.trades.length} Trades
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Win Rate
                  </span>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--brand-emerald)" }}>
                    {(
                      (selectedDayTrades.trades.filter((t) => t.netPnl > 0).length /
                        selectedDayTrades.trades.length) *
                      100
                    ).toFixed(0)}
                    %
                  </div>
                </div>
              </div>

              <div className={styles.drilldownTradesTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Instrument</th>
                      <th>Side</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>Size</th>
                      <th>Net P&L</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDayTrades.trades.map((t) => {
                      const isProfit = t.netPnl >= 0;
                      return (
                        <tr key={t.id}>
                          <td>{new Date(t.entryTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</td>
                          <td><strong>{t.symbol}</strong></td>
                          <td>
                            <Badge variant={t.direction === "LONG" ? "profit" : "loss"}>
                              {t.direction}
                            </Badge>
                          </td>
                          <td>${t.entryPrice.toLocaleString("en-US")}</td>
                          <td>{t.exitPrice ? `$${t.exitPrice.toLocaleString("en-US")}` : "Open"}</td>
                          <td>{t.quantity}</td>
                          <td>
                            <strong style={{ color: isProfit ? "var(--brand-emerald)" : "var(--brand-crimson)" }}>
                              {isProfit ? "+" : ""}${t.netPnl.toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <Link href={`/trades/${t.id}`}>
                              <Button variant="ghost" size="sm">
                                Inspect <ExternalLink size={12} style={{ marginLeft: "4px" }} />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                <Button variant="secondary" onClick={() => setSelectedDayTrades(null)}>
                  Close
                </Button>
                <Link href="/trades">
                  <Button variant="primary">
                    View in Full Journal <ArrowRight size={14} style={{ marginLeft: "6px" }} />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
