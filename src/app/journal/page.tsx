"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Journal.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DayJournalDetail } from "@/lib/journal/journal-service";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Save,
  CheckCircle2,
  Smile,
  Frown,
  Meh,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export default function DailyJournalPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });

  const [dayDetail, setDayDetail] = useState<DayJournalDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Form Fields
  const [title, setTitle] = useState<string>("");
  const [preSessionPlan, setPreSessionPlan] = useState<string>("");
  const [postSessionReview, setPostSessionReview] = useState<string>("");
  const [emotionalScore, setEmotionalScore] = useState<number>(7);
  const [marketSentiment, setMarketSentiment] = useState<"Bullish" | "Bearish" | "Neutral">("Neutral");

  useEffect(() => {
    fetchDayDetail();
  }, [selectedDate]);

  const fetchDayDetail = async () => {
    setIsLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/v1/journal/${selectedDate}`);
      const json = await res.json();
      if (json.success && json.data) {
        const d: DayJournalDetail = json.data;
        setDayDetail(d);
        if (d.entry) {
          setTitle(d.entry.title || "");
          setPreSessionPlan(d.entry.preSessionPlan || "");
          setPostSessionReview(d.entry.postSessionReview || "");
          setEmotionalScore(d.entry.emotionalScore ?? 7);
          setMarketSentiment(d.entry.marketSentiment ?? "Neutral");
        } else {
          setTitle(`Trading Journal - ${selectedDate}`);
          setPreSessionPlan("");
          setPostSessionReview("");
          setEmotionalScore(7);
          setMarketSentiment("Neutral");
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate: selectedDate,
          title,
          preSessionPlan,
          postSessionReview,
          emotionalScore,
          marketSentiment,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch {
      alert("Failed to save journal entry.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setUTCDate(d.getUTCDate() - 1);
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setUTCDate(d.getUTCDate() + 1);
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().substring(0, 10));
  };

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Daily Trading Journal</h1>
            <p className={styles.subtitle}>
              Document pre-session trading thesis, execution psychology, post-market debriefs, and review linked fills
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              <Save size={15} style={{ marginRight: "6px" }} /> Save Journal Entry
            </Button>
          </div>
        </div>

        {/* Date Navigator & Day Stats Bar */}
        <div className={styles.dateBar}>
          <div className={styles.dateNav}>
            <Button variant="ghost" size="sm" onClick={handlePrevDay}>
              <ChevronLeft size={16} />
            </Button>
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={handleNextDay}>
              <ChevronRight size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>

          {/* Quick Stats for this day */}
          {dayDetail && (
            <div className={styles.dayStats}>
              <div className={styles.dayStatItem}>
                <span className={styles.dayStatLabel}>Day Net P&L</span>
                <span
                  className={styles.dayStatValue}
                  style={{
                    color:
                      dayDetail.dayNetPnl >= 0
                        ? "var(--brand-emerald)"
                        : "var(--brand-crimson)",
                  }}
                >
                  {dayDetail.dayNetPnl >= 0 ? "+" : ""}${dayDetail.dayNetPnl.toFixed(2)}
                </span>
              </div>
              <div className={styles.dayStatItem}>
                <span className={styles.dayStatLabel}>Trades Executed</span>
                <span className={styles.dayStatValue}>{dayDetail.tradeCount}</span>
              </div>
              <div className={styles.dayStatItem}>
                <span className={styles.dayStatLabel}>Win / Loss</span>
                <span className={styles.dayStatValue}>
                  {dayDetail.winningCount}W / {dayDetail.losingCount}L
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid var(--brand-emerald)",
              borderRadius: "var(--radius-md)",
              color: "var(--brand-emerald)",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            Journal entry for {selectedDate} saved successfully!
          </div>
        )}

        {/* Main 2-Column Journal Layout */}
        <div className={styles.journalGrid}>
          {/* Left Column: Form Editors */}
          <div className={styles.card}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Journal Entry Title</label>
              <input
                type="text"
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CPI Morning Breakout & VWAP Reversal Review"
              />
            </div>

            {/* Emotional Score & Sentiment Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <span>Emotional State / Mindset</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                    {emotionalScore <= 4 ? "Tilting / Anxious" : emotionalScore <= 7 ? "Calm & Neutral" : "Disciplined / Flow"}
                  </span>
                </label>
                <div className={styles.sliderWrapper}>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className={styles.slider}
                    value={emotionalScore}
                    onChange={(e) => setEmotionalScore(parseInt(e.target.value, 10))}
                  />
                  <span className={styles.sliderValue}>{emotionalScore}/10</span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Pre-Market Sentiment</label>
                <div className={styles.sentimentButtons}>
                  {(["Bullish", "Neutral", "Bearish"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.sentimentBtn} ${marketSentiment === s ? styles.sentimentBtnActive : ""}`}
                      onClick={() => setMarketSentiment(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pre-Market Game Plan */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Pre-Market Preparation & Game Plan
              </label>
              <textarea
                className={styles.textarea}
                value={preSessionPlan}
                onChange={(e) => setPreSessionPlan(e.target.value)}
                placeholder="Key levels to watch, economic calendar announcements (FOMC, CPI, NFP), high timeframe market structure, setups you plan to trade..."
              />
            </div>

            {/* Post-Session Debrief */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Post-Market Debrief & Review
              </label>
              <textarea
                className={styles.textarea}
                value={postSessionReview}
                onChange={(e) => setPostSessionReview(e.target.value)}
                placeholder="Did you follow your rules? Did you execute with edge or FOMO? What was your biggest lesson from today's session?"
              />
            </div>
          </div>

          {/* Right Column: Linked Trades on this Date */}
          <div className={styles.tradesSidebar}>
            <div className={styles.tradesCard}>
              <div className={styles.tradesCardHeader}>
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                  Day Executions ({dayDetail?.trades.length || 0})
                </span>
                <Link href="/trades">
                  <Button variant="ghost" size="sm">
                    Journal Log
                  </Button>
                </Link>
              </div>

              {!dayDetail || dayDetail.trades.length === 0 ? (
                <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  <BookOpen size={28} style={{ margin: "0 auto var(--space-2)", opacity: 0.5 }} />
                  No trade executions recorded on this date.
                </div>
              ) : (
                dayDetail.trades.map((t) => {
                  const isProfit = t.netPnl >= 0;
                  return (
                    <div key={t.id} className={styles.tradeItem}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong>{t.symbol}</strong>
                          <Badge variant={t.direction === "LONG" ? "profit" : "loss"} size="sm">
                            {t.direction}
                          </Badge>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {new Date(t.entryTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: isProfit ? "var(--brand-emerald)" : "var(--brand-crimson)",
                          }}
                        >
                          {isProfit ? "+" : ""}${t.netPnl.toFixed(2)}
                        </div>
                        <Link href={`/trades/${t.id}`} style={{ fontSize: "11px", color: "var(--brand-blue)" }}>
                          Inspect <ExternalLink size={10} style={{ display: "inline" }} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
