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
  const [trades, setTrades] = useState<Trade[]>([
    {
      id: "trd_01",
      userId: "usr_alex",
      accountId: "acc_101",
      accountName: "Apex 50k #1",
      symbol: "NQ",
      assetClass: "FUTURES",
      direction: "LONG",
      status: "CLOSED",
      entryTime: "2026-10-12 14:32",
      exitTime: "2026-10-12 14:48",
      entryPrice: 18250.25,
      exitPrice: 18275.5,
      quantity: 2,
      contractMultiplier: 20,
      initialRisk: 480,
      grossPnl: 1010.0,
      fees: 12.5,
      commissions: 6.0,
      netPnl: 991.5,
      rMultiple: 2.06,
      rating: 5,
      marketSession: "NY Open",
      playbookName: "NY Open Breakout",
      tags: [{ id: "t1", tradeId: "trd_01", tagType: "SETUP", tagValue: "A+ Setup" }],
      createdAt: "2026-10-12",
    },
    {
      id: "trd_02",
      userId: "usr_alex",
      accountId: "acc_101",
      accountName: "Apex 50k #1",
      symbol: "ES",
      assetClass: "FUTURES",
      direction: "SHORT",
      status: "CLOSED",
      entryTime: "2026-10-12 10:15",
      exitTime: "2026-10-12 10:45",
      entryPrice: 5042.5,
      exitPrice: 5034.0,
      quantity: 2,
      contractMultiplier: 50,
      initialRisk: 400,
      grossPnl: 850.0,
      fees: 8.5,
      commissions: 4.0,
      netPnl: 837.5,
      rMultiple: 2.09,
      rating: 4,
      marketSession: "NY AM",
      playbookName: "Liquidity Sweep",
      tags: [{ id: "t2", tradeId: "trd_02", tagType: "SETUP", tagValue: "Order Block" }],
      createdAt: "2026-10-12",
    },
    {
      id: "trd_03",
      userId: "usr_alex",
      accountId: "acc_102",
      accountName: "IBKR Stocks",
      symbol: "NVDA",
      assetClass: "STOCKS",
      direction: "LONG",
      status: "CLOSED",
      entryTime: "2026-10-11 15:20",
      exitTime: "2026-10-11 15:55",
      entryPrice: 132.5,
      exitPrice: 130.8,
      quantity: 200,
      contractMultiplier: 1,
      initialRisk: 340,
      grossPnl: -340.0,
      fees: 2.0,
      commissions: 2.0,
      netPnl: -344.0,
      rMultiple: -1.01,
      rating: 2,
      marketSession: "NY PM",
      playbookName: "VWAP Reversal",
      tags: [{ id: "t3", tradeId: "trd_03", tagType: "MISTAKE", tagValue: "Chased Entry" }],
      createdAt: "2026-10-11",
    },
    {
      id: "trd_04",
      userId: "usr_alex",
      accountId: "acc_101",
      accountName: "Apex 50k #1",
      symbol: "NQ",
      assetClass: "FUTURES",
      direction: "SHORT",
      status: "CLOSED",
      entryTime: "2026-10-10 11:00",
      exitTime: "2026-10-10 11:24",
      entryPrice: 18190.0,
      exitPrice: 18155.0,
      quantity: 2,
      contractMultiplier: 20,
      initialRisk: 500,
      grossPnl: 1400.0,
      fees: 12.5,
      commissions: 6.0,
      netPnl: 1381.5,
      rMultiple: 2.76,
      rating: 5,
      marketSession: "NY AM",
      playbookName: "Gap Fill Setup",
      tags: [{ id: "t4", tradeId: "trd_04", tagType: "SETUP", tagValue: "Key Level" }],
      createdAt: "2026-10-10",
    },
  ]);

  const [accounts, setAccounts] = useState<TradingAccount[]>([
    {
      id: "acc_101",
      userId: "usr_alex",
      name: "Apex 50k #1",
      brokerName: "Tradovate",
      accountType: "PROP_EVALUATION",
      assetClass: "FUTURES",
      initialBalance: 50000,
      currentBalance: 52450.5,
      currency: "USD",
      status: "ACTIVE",
      createdAt: "2026-09-01",
    },
    {
      id: "acc_102",
      userId: "usr_alex",
      name: "IBKR Stocks",
      brokerName: "Interactive Brokers",
      accountType: "MARGIN",
      assetClass: "STOCKS",
      initialBalance: 25000,
      currentBalance: 28420.0,
      currency: "USD",
      status: "ACTIVE",
      createdAt: "2026-08-15",
    },
  ]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const handleDuplicateTrade = (trade: Trade) => {
    const duplicated: Trade = {
      ...trade,
      id: `trd_${Date.now()}`,
      status: "OPEN",
      entryTime: new Date().toISOString().slice(0, 16),
      exitTime: undefined,
      exitPrice: undefined,
      notes: `Duplicated from ${trade.id}`,
    };
    setTrades([duplicated, ...trades]);
  };

  const handleDeleteTrade = (id: string) => {
    if (confirm("Delete this trade record?")) {
      setTrades(trades.filter((t) => t.id !== id));
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
