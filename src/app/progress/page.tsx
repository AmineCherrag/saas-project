"use client";

import React, { useState, useEffect } from "react";
import styles from "./Progress.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  RuleChecklistItem,
  DisciplineScoreData,
} from "@/lib/discipline/discipline-service";
import {
  CheckSquare,
  Flame,
  Award,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function DisciplineTrackerPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });

  const [checklist, setChecklist] = useState<RuleChecklistItem[]>([]);
  const [scoreData, setScoreData] = useState<DisciplineScoreData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Rule Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [ruleType, setRuleType] = useState<"DAILY" | "WEEKLY" | "PER_TRADE">("DAILY");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchChecklist();
    fetchScore();
  }, [selectedDate]);

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/v1/discipline/logs?date=${selectedDate}`);
      const json = await res.json();
      if (json.success && json.data) {
        setChecklist(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScore = async () => {
    try {
      const res = await fetch("/api/v1/discipline/score");
      const json = await res.json();
      if (json.success && json.data) {
        setScoreData(json.data);
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleRule = async (ruleId: string, currentAdhered: boolean) => {
    const nextState = !currentAdhered;

    // Optimistically update local checklist state
    setChecklist((prev) =>
      prev.map((item) =>
        item.rule.id === ruleId ? { ...item, isAdhered: nextState } : item
      )
    );

    try {
      await fetch("/api/v1/discipline/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleId,
          logDate: selectedDate,
          isAdhered: nextState,
        }),
      });
      fetchScore(); // Refresh score & streak
    } catch {
      // Revert on error
      fetchChecklist();
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/discipline/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, ruleType }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create rule");
      }

      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      fetchChecklist();
      fetchScore();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this trading rule?")) return;
    try {
      const res = await fetch(`/api/v1/discipline/rules/${ruleId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchChecklist();
        fetchScore();
      }
    } catch {
      alert("Failed to delete rule.");
    }
  };

  const adheredToday = checklist.filter((c) => c.isAdhered).length;
  const isAllAdhered = checklist.length > 0 && adheredToday === checklist.length;

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Trading Discipline & Rule Tracker</h1>
            <p className={styles.subtitle}>
              Eliminate account leakage, enforce execution rules, and build compounding psychological discipline
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} style={{ marginRight: "6px" }} /> Add Trading Rule
            </Button>
          </div>
        </div>

        {/* Score KPIs Grid */}
        {scoreData && (
          <div className={styles.scoreGrid}>
            <div className={styles.scoreCard}>
              <span className={styles.scoreLabel}>Overall Discipline Score</span>
              <span
                className={styles.scoreValue}
                style={{
                  color:
                    scoreData.overallScore >= 80
                      ? "var(--brand-emerald)"
                      : scoreData.overallScore >= 60
                      ? "var(--brand-amber)"
                      : "var(--brand-crimson)",
                }}
              >
                {scoreData.overallScore.toFixed(1)}%
              </span>
              <span className={styles.scoreSub}>
                {scoreData.adheredCount} rules honored / {scoreData.violatedCount} breaches
              </span>
            </div>

            <div className={styles.scoreCard}>
              <span className={styles.scoreLabel}>Discipline Streak</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Flame size={28} color="var(--brand-amber)" />
                <span className={styles.scoreValue} style={{ color: "var(--brand-amber)" }}>
                  {scoreData.currentStreakDays} Days
                </span>
              </div>
              <span className={styles.scoreSub}>Consecutive 100% adherence days</span>
            </div>

            <div className={styles.scoreCard}>
              <span className={styles.scoreLabel}>Active Execution Rules</span>
              <span className={styles.scoreValue}>{scoreData.activeRulesCount}</span>
              <span className={styles.scoreSub}>Standard Operating Procedures</span>
            </div>
          </div>
        )}

        {/* Daily Checklist Section */}
        <div className={styles.checklistCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Daily Execution Checklist</h2>
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                Check off each rule followed during today's trading session.
              </span>
            </div>

            {/* Date Switcher */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                }}
              />
              {isAllAdhered && (
                <Badge variant="profit">
                  <CheckCircle2 size={12} style={{ marginRight: "4px" }} />
                  100% Compliant
                </Badge>
              )}
            </div>
          </div>

          {checklist.length === 0 && !isLoading ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-muted)" }}>
              <CheckSquare size={36} style={{ margin: "0 auto var(--space-2)", opacity: 0.5 }} />
              <p>No trading rules defined yet. Click "Add Trading Rule" above to create your rule checklist!</p>
            </div>
          ) : (
            <div className={styles.rulesList}>
              {checklist.map(({ rule, isAdhered }) => (
                <div
                  key={rule.id}
                  className={`${styles.ruleItem} ${isAdhered ? styles.ruleItemAdhered : ""}`}
                >
                  <div className={styles.ruleLeft}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isAdhered}
                      onChange={() => handleToggleRule(rule.id, isAdhered)}
                    />
                    <div>
                      <span className={styles.ruleTitle}>{rule.title}</span>
                      {rule.description && (
                        <p className={styles.ruleDesc}>{rule.description}</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant="neutral" size="sm">
                      {rule.ruleType}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 size={13} style={{ color: "var(--brand-crimson)" }} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Rule Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Trading Rule"
        >
          <form onSubmit={handleCreateRule} className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Rule Title *</label>
              <input
                type="text"
                required
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Never move stop loss against myself"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Description / Rationale</label>
              <input
                type="text"
                className={styles.input}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Prevents catastrophic outsized drawdowns and protects capital"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Frequency / Scope</label>
              <select
                className={styles.input}
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as any)}
              >
                <option value="DAILY">Daily Habit (Evaluated each day)</option>
                <option value="PER_TRADE">Per-Trade Rule (Checked on every execution)</option>
                <option value="WEEKLY">Weekly Risk Rule</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>
                Save Trading Rule
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
