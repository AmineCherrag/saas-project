"use client";

import React, { useState, useEffect } from "react";
import styles from "./Trades.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AddTradeModal } from "@/components/trades/AddTradeModal";
import {
  Plus,
  UploadCloud,
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  ExternalLink,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Trade, TradingAccount } from "@/types";

export default function TradesLogPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchTrades();
    fetchAccounts();
  }, []);

  const fetchTrades = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/trades?limit=100");
      const json = await res.json();
      if (json.success && json.data) {
        setTrades(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

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

  // Filtered trades
  const filteredTrades = trades.filter((t) => {
    if (searchTerm && !t.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedDirection !== "ALL" && t.direction !== selectedDirection) {
      return false;
    }
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const handleDuplicateTrade = async (trade: Trade) => {
    try {
      const res = await fetch(`/api/v1/trades/${trade.id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        fetchTrades();
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (confirm("Delete this trade record?")) {
      try {
        const res = await fetch(`/api/v1/trades/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          setTrades((prev) => prev.filter((t) => t.id !== id));
        }
      } catch {
        // Ignore
      }
    }
  };

  const handleExportTrades = () => {
    const jsonStr = JSON.stringify(trades, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradepulse_trades_${Date.now()}.json`;
    a.click();
    a.remove();
  };

  const columns: Column<Trade>[] = [
    {
      key: "symbol",
      header: "Ticker",
      render: (t) => (
        <div className={styles.symbolCell}>
          <a href={`/trades/${t.id}`} className={styles.symbolLink}>
            {t.symbol}
          </a>
          <span className={styles.subAccount}>{t.accountName}</span>
        </div>
      ),
    },
    {
      key: "direction",
      header: "Side",
      align: "center",
      render: (t) => (
        <Badge variant={t.direction === "LONG" ? "profit" : "loss"} size="sm">
          {t.direction}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (t) => (
        <Badge variant={t.status === "CLOSED" ? "neutral" : "cyan"} size="sm">
          {t.status}
        </Badge>
      ),
    },
    {
      key: "entryPrice",
      header: "Entry Price",
      align: "right",
      render: (t) => `$${t.entryPrice.toLocaleString("en-US")}`,
    },
    {
      key: "exitPrice",
      header: "Exit Price",
      align: "right",
      render: (t) => (t.exitPrice ? `$${t.exitPrice.toLocaleString("en-US")}` : "—"),
    },
    {
      key: "quantity",
      header: "Size",
      align: "right",
      render: (t) => t.quantity,
    },
    {
      key: "netPnl",
      header: "Net P&L",
      align: "right",
      render: (t) => {
        const isProfitable = t.netPnl >= 0;
        return (
          <span className={isProfitable ? styles.pnlProfit : styles.pnlLoss}>
            {isProfitable ? "+" : ""}$
            {t.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: "rMultiple",
      header: "R-Multiple",
      align: "right",
      render: (t) => (
        <span
          className={
            t.rMultiple && t.rMultiple > 0 ? styles.pnlProfit : styles.pnlLoss
          }
        >
          {t.rMultiple ? `${t.rMultiple >= 0 ? "+" : ""}${t.rMultiple.toFixed(2)} R` : "—"}
        </span>
      ),
    },
    {
      key: "playbookName",
      header: "Playbook",
      render: (t) => (
        <Badge variant="primary" size="sm">
          {t.playbookName || "Uncategorized"}
        </Badge>
      ),
    },
    {
      key: "entryTime",
      header: "Time",
      align: "right",
      render: (t) => <span className={styles.timeCell}>{t.entryTime}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (t) => (
        <div className={styles.actionsCell}>
          <a
            href={`/trades/${t.id}`}
            className={styles.actionBtn}
            title="View Details & Chart"
          >
            <ExternalLink size={14} />
          </a>
          <button
            className={styles.actionBtn}
            onClick={() => handleDuplicateTrade(t)}
            title="Duplicate Trade"
          >
            <Copy size={14} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteAction}`}
            onClick={() => handleDeleteTrade(t.id)}
            title="Delete Trade"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Header */}
        <section className={styles.header}>
          <div>
            <div className={styles.pillTag}>
              <Sparkles size={13} />
              <span>EXECUTION JOURNAL</span>
            </div>
            <h1 className={styles.title}>Trades Log & History</h1>
            <p className={styles.subtitle}>
              Search, filter, analyze executions, and inspect individual trade charts.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Download size={15} />}
              onClick={handleExportTrades}
            >
              Export JSON
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<UploadCloud size={15} />}
              onClick={() => (window.location.href = "/trades/import")}
            >
              Import CSV
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Log New Trade
            </Button>
          </div>
        </section>

        {/* Filter Toolbar */}
        <div className={styles.filterToolbar}>
          <div className={styles.searchWrapper}>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticker (e.g. NQ, ES, AAPL)..."
              leftAddon={<Search size={15} />}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className={styles.filterDropdown}
            >
              <option value="ALL">Side: All</option>
              <option value="LONG">Longs Only</option>
              <option value="SHORT">Shorts Only</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterDropdown}
            >
              <option value="ALL">Status: All</option>
              <option value="CLOSED">Closed Only</option>
              <option value="OPEN">Open Only</option>
            </select>
          </div>
        </div>

        {/* Trades Table */}
        <div className={styles.tableCard}>
          <DataTable
            columns={columns}
            data={filteredTrades}
            keyExtractor={(item) => item.id}
          />
        </div>
      </div>

      {/* Add Trade Modal */}
      <AddTradeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        accounts={accounts}
        onTradeCreated={(newTrade) => {
          setTrades([newTrade, ...trades]);
        }}
      />
    </AppShell>
  );
}
