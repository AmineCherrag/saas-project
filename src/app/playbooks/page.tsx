"use client";

import React, { useState, useEffect } from "react";
import styles from "./Playbooks.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EnrichedPlaybook } from "@/lib/playbooks/playbook-service";
import {
  Workflow,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Target,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<EnrichedPlaybook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [setupRules, setSetupRules] = useState<string>("");
  const [entryCriteria, setEntryCriteria] = useState<string>("");
  const [exitCriteria, setExitCriteria] = useState<string>("");
  const [riskRules, setRiskRules] = useState<string>("");
  const [preferredSession, setPreferredSession] = useState<string>("NY Open");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  const fetchPlaybooks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/playbooks");
      const json = await res.json();
      if (json.success && json.data) {
        setPlaybooks(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setSetupRules("");
    setEntryCriteria("");
    setExitCriteria("");
    setRiskRules("");
    setPreferredSession("NY Open");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pb: EnrichedPlaybook) => {
    setEditingId(pb.id);
    setName(pb.name);
    setDescription(pb.description || "");
    setSetupRules(pb.setupRules);
    setEntryCriteria(pb.entryCriteria || "");
    setExitCriteria(pb.exitCriteria || "");
    setRiskRules(pb.riskRules || "");
    setPreferredSession(pb.preferredSession || "NY Open");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        description,
        setupRules,
        entryCriteria,
        exitCriteria,
        riskRules,
        preferredSession,
      };

      const url = editingId ? `/api/v1/playbooks/${editingId}` : "/api/v1/playbooks";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save playbook");
      }

      setIsModalOpen(false);
      fetchPlaybooks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving playbook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this strategy playbook?")) return;
    try {
      const res = await fetch(`/api/v1/playbooks/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchPlaybooks();
      }
    } catch {
      alert("Failed to delete playbook.");
    }
  };

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Strategy Playbooks</h1>
            <p className={styles.subtitle}>
              Document systematic trading setups, track strategy win rates, enforce risk parameters, and link executions
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={handleOpenCreate}>
              <Plus size={16} style={{ marginRight: "6px" }} /> New Strategy Playbook
            </Button>
          </div>
        </div>

        {/* Playbooks Grid */}
        {playbooks.length === 0 && !isLoading ? (
          <div style={{ padding: "var(--space-12)", textAlign: "center", background: "var(--bg-surface)", borderRadius: "var(--radius-xl)", border: "1px dashed var(--border-subtle)" }}>
            <Workflow size={48} style={{ margin: "0 auto var(--space-3)", opacity: 0.5 }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
              No Strategy Playbooks Created
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", maxWidth: "480px", margin: "0 auto var(--space-4)" }}>
              Systematic playbooks let you document your repeatable edge (e.g. Opening Range Breakout, VWAP Reversals) and measure which setups make you the most money.
            </p>
            <Button variant="primary" onClick={handleOpenCreate}>
              Create Your First Playbook
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {playbooks.map((pb) => {
              const isProfit = pb.totalNetPnl >= 0;
              return (
                <div key={pb.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.titleArea}>
                      <span className={styles.playbookTitle}>{pb.name}</span>
                      {pb.preferredSession && (
                        <div>
                          <Badge variant="neutral" size="sm">
                            {pb.preferredSession}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(pb)}>
                        <Edit2 size={13} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(pb.id)}>
                        <Trash2 size={13} style={{ color: "var(--brand-crimson)" }} />
                      </Button>
                    </div>
                  </div>

                  {pb.description && (
                    <p className={styles.description}>{pb.description}</p>
                  )}

                  {/* Rules Accordion Section */}
                  <div className={styles.rulesSection}>
                    <div className={styles.ruleBlock}>
                      <span className={styles.ruleLabel}>Setup Rule:</span>
                      <span className={styles.ruleText}>{pb.setupRules}</span>
                    </div>
                    {pb.entryCriteria && (
                      <div className={styles.ruleBlock}>
                        <span className={styles.ruleLabel}>Entry Trigger:</span>
                        <span className={styles.ruleText}>{pb.entryCriteria}</span>
                      </div>
                    )}
                    {pb.exitCriteria && (
                      <div className={styles.ruleBlock}>
                        <span className={styles.ruleLabel}>Exit / Target:</span>
                        <span className={styles.ruleText}>{pb.exitCriteria}</span>
                      </div>
                    )}
                  </div>

                  {/* Performance Metrics Row */}
                  <div className={styles.statsRow}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Trades</span>
                      <span className={styles.statVal}>{pb.tradeCount}</span>
                    </div>

                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Win Rate</span>
                      <span
                        className={styles.statVal}
                        style={{ color: pb.winRate && pb.winRate >= 50 ? "var(--brand-emerald)" : "var(--brand-crimson)" }}
                      >
                        {pb.winRate ? `${pb.winRate.toFixed(1)}%` : "—"}
                      </span>
                    </div>

                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Net P&L</span>
                      <span
                        className={styles.statVal}
                        style={{ color: isProfit ? "var(--brand-emerald)" : "var(--brand-crimson)" }}
                      >
                        {isProfit ? "+" : ""}${pb.totalNetPnl.toFixed(2)}
                      </span>
                    </div>

                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Avg R</span>
                      <span className={styles.statVal}>
                        {pb.avgRMultiple ? `${pb.avgRMultiple.toFixed(2)} R` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Playbook Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? "Edit Strategy Playbook" : "Create New Strategy Playbook"}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Strategy Name *</label>
              <input
                type="text"
                required
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Opening Range Breakout (ORB)"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Strategy Description</label>
              <input
                type="text"
                className={styles.input}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High probability morning momentum breakout above 15-minute high"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Setup Rules & Context *</label>
                <textarea
                  required
                  className={styles.textarea}
                  value={setupRules}
                  onChange={(e) => setSetupRules(e.target.value)}
                  placeholder="Market structure conditions, higher timeframe trend, key S/R levels..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Entry Trigger Criteria</label>
                <textarea
                  className={styles.textarea}
                  value={entryCriteria}
                  onChange={(e) => setEntryCriteria(e.target.value)}
                  placeholder="Candlestick pattern, order flow volume confirmation, delta divergence..."
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Exit & Target Criteria</label>
                <textarea
                  className={styles.textarea}
                  value={exitCriteria}
                  onChange={(e) => setExitCriteria(e.target.value)}
                  placeholder="Take profit targets (2R, VWAP, opposing liquidity pool), trailing stop method..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Risk Parameters & Rules</label>
                <textarea
                  className={styles.textarea}
                  value={riskRules}
                  onChange={(e) => setRiskRules(e.target.value)}
                  placeholder="Max dollar risk per contract, maximum drawdown threshold for this setup..."
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Preferred Market Session</label>
              <input
                type="text"
                className={styles.input}
                value={preferredSession}
                onChange={(e) => setPreferredSession(e.target.value)}
                placeholder="e.g. NY Open (09:30 - 11:30 EST)"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting}>
                {editingId ? "Save Changes" : "Create Playbook"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
