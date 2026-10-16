"use client";

import React, { useState, useEffect } from "react";
import styles from "./Accounts.module.css";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Wallet,
  Plus,
  Landmark,
  TrendingUp,
  Shield,
  Edit2,
  Archive,
  Trash2,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { TradingAccount, AccountType, AssetClass, AccountStatus } from "@/types";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/accounts");
      const json = await res.json();
      if (json.success && json.data) {
        setAccounts(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("PROP_EVALUATION");
  const [assetClass, setAssetClass] = useState<AssetClass>("FUTURES");
  const [initialBalance, setInitialBalance] = useState("50000");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");

  const accountTypeOptions = [
    { value: "PROP_EVALUATION", label: "Prop Firm Evaluation" },
    { value: "PROP_FUNDED", label: "Prop Firm Funded" },
    { value: "MARGIN", label: "Personal Margin Account" },
    { value: "CASH", label: "Personal Cash Account" },
    { value: "DEMO", label: "Paper / Demo Account" },
  ];

  const assetClassOptions = [
    { value: "FUTURES", label: "Futures (ES, NQ, YM, CL, GC)" },
    { value: "STOCKS", label: "Equities / Stocks" },
    { value: "OPTIONS", label: "Equity Options" },
    { value: "FOREX", label: "Foreign Exchange (Forex)" },
    { value: "CRYPTO", label: "Cryptocurrency" },
    { value: "CFDS", label: "CFDs" },
  ];

  const currencyOptions = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "CAD", label: "CAD ($)" },
    { value: "AUD", label: "AUD ($)" },
    { value: "JPY", label: "JPY (¥)" },
  ];

  const openCreateModal = () => {
    setEditingAccount(null);
    setName("");
    setBrokerName("");
    setAccountType("PROP_EVALUATION");
    setAssetClass("FUTURES");
    setInitialBalance("50000");
    setCurrency("USD");
    setDescription("");
    setIsModalOpen(true);
  };

  const openEditModal = (acc: TradingAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBrokerName(acc.brokerName);
    setAccountType(acc.accountType);
    setAssetClass(acc.assetClass);
    setInitialBalance(acc.initialBalance.toString());
    setCurrency(acc.currency);
    setDescription(acc.description || "");
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    const balanceNum = parseFloat(initialBalance) || 0;

    if (editingAccount) {
      // Update
      try {
        const res = await fetch(`/api/v1/accounts/${editingAccount.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            brokerName,
            accountType,
            assetClass,
            currency,
            description,
          }),
        });
        const json = await res.json();
        if (json.success) {
          fetchAccounts();
        } else {
          alert(json.error?.message || "Failed to update account");
        }
      } catch {
        alert("Failed to update account");
      }
    } else {
      // Create new
      try {
        const res = await fetch("/api/v1/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            brokerName,
            accountType,
            assetClass,
            initialBalance: balanceNum,
            currency,
            description,
          }),
        });
        const json = await res.json();
        if (json.success) {
          fetchAccounts();
        } else {
          alert(json.error?.message || "Failed to create account");
        }
      } catch {
        alert("Failed to create account");
      }
    }

    setIsModalOpen(false);
  };

  const handleToggleArchive = async (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;
    const nextStatus = acc.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    try {
      const res = await fetch(`/api/v1/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAccounts();
      }
    } catch {
      // Ignore
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm("Are you sure you want to delete this trading account?")) {
      try {
        const res = await fetch(`/api/v1/accounts/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          setAccounts((prev) => prev.filter((acc) => acc.id !== id));
        } else {
          alert(json.error?.message || "Failed to delete account");
        }
      } catch {
        alert("Failed to delete account");
      }
    }
  };

  // Filtered accounts
  const filteredAccounts = accounts.filter((acc) => {
    if (filterStatus === "ACTIVE") return acc.status === "ACTIVE";
    if (filterStatus === "ARCHIVED") return acc.status === "ARCHIVED";
    return true;
  });

  // Calculate Aggregates
  const totalCombinedBalance = accounts
    .filter((a) => a.status === "ACTIVE")
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const activeAccountsCount = accounts.filter((a) => a.status === "ACTIVE").length;
  const propAccountsCount = accounts.filter(
    (a) => a.accountType === "PROP_EVALUATION" || a.accountType === "PROP_FUNDED"
  ).length;

  return (
    <AppShell>
      <div className={styles.container}>
        {/* Header */}
        <section className={styles.headerSection}>
          <div>
            <div className={styles.pillTag}>
              <Sparkles size={13} />
              <span>MULTI-TENANT TRADING PORTFOLIO</span>
            </div>
            <h1 className={styles.title}>Trading Accounts</h1>
            <p className={styles.subtitle}>
              Manage multiple prop firm evaluations, personal broker connections, and demo portfolios.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            Create Trading Account
          </Button>
        </section>

        {/* Stats Row */}
        <section className={styles.statsRow}>
          <StatCard
            title="Active Equity Balance"
            value={`$${totalCombinedBalance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}`}
            subtitle="Across all active broker accounts"
            icon={<Wallet size={18} />}
            variant="profit"
          />
          <StatCard
            title="Active Accounts"
            value={activeAccountsCount}
            subtitle={`${accounts.length} total portfolios`}
            icon={<Layers size={18} />}
          />
          <StatCard
            title="Prop Firm Portfolios"
            value={propAccountsCount}
            subtitle="Futures & Forex evaluation accounts"
            icon={<Shield size={18} />}
            variant="primary"
          />
          <StatCard
            title="Supported Asset Classes"
            value="6 Classes"
            subtitle="Futures, Stocks, Crypto, Options"
            icon={<TrendingUp size={18} />}
          />
        </section>

        {/* Filter Tabs */}
        <div className={styles.filterBar}>
          <div className={styles.tabButtons}>
            <button
              className={`${styles.tabBtn} ${filterStatus === "ALL" ? styles.activeTab : ""}`}
              onClick={() => setFilterStatus("ALL")}
            >
              All Accounts ({accounts.length})
            </button>
            <button
              className={`${styles.tabBtn} ${filterStatus === "ACTIVE" ? styles.activeTab : ""}`}
              onClick={() => setFilterStatus("ACTIVE")}
            >
              Active ({activeAccountsCount})
            </button>
            <button
              className={`${styles.tabBtn} ${filterStatus === "ARCHIVED" ? styles.activeTab : ""}`}
              onClick={() => setFilterStatus("ARCHIVED")}
            >
              Archived ({accounts.length - activeAccountsCount})
            </button>
          </div>
        </div>

        {/* Account Cards Grid */}
        <section className={styles.cardsGrid}>
          {filteredAccounts.map((account) => {
            const profitDelta = account.currentBalance - account.initialBalance;
            const isProfitable = profitDelta >= 0;
            const returnPct = ((profitDelta / account.initialBalance) * 100).toFixed(2);

            return (
              <div
                key={account.id}
                className={`${styles.accountCard} ${
                  account.status === "ARCHIVED" ? styles.cardArchived : ""
                }`}
              >
                {/* Card Top */}
                <div className={styles.cardTop}>
                  <div className={styles.accountIdentity}>
                    <div className={styles.brokerIcon}>
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h3 className={styles.accountName}>{account.name}</h3>
                      <span className={styles.brokerLabel}>{account.brokerName}</span>
                    </div>
                  </div>

                  <Badge
                    variant={account.status === "ACTIVE" ? "profit" : "neutral"}
                    size="sm"
                  >
                    {account.status}
                  </Badge>
                </div>

                {/* Badges Row */}
                <div className={styles.badgesRow}>
                  <Badge variant="primary" size="sm">
                    {account.assetClass}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {account.accountType.replace("_", " ")}
                  </Badge>
                  <Badge variant="cyan" size="sm">
                    {account.currency}
                  </Badge>
                </div>

                {/* Balance Display */}
                <div className={styles.balanceContainer}>
                  <span className={styles.balanceLabel}>Current Account Balance</span>
                  <div className={styles.balanceValue}>
                    ${account.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>

                  <div className={styles.pnlRow}>
                    <span className={isProfitable ? styles.profitPill : styles.lossPill}>
                      {isProfitable ? "+" : ""}
                      ${profitDelta.toLocaleString("en-US", { minimumFractionDigits: 2 })} (
                      {isProfitable ? "+" : ""}
                      {returnPct}%)
                    </span>
                    <span className={styles.initialLabel}>
                      Initial: ${account.initialBalance.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>

                {account.description && (
                  <p className={styles.accountDescription}>{account.description}</p>
                )}

                {/* Card Actions */}
                <div className={styles.cardActions}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ExternalLink size={14} />}
                    onClick={() => (window.location.href = `/trades?accountId=${account.id}`)}
                  >
                    View Trades
                  </Button>

                  <div className={styles.actionIcons}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => openEditModal(account)}
                      title="Edit Account"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={() => handleToggleArchive(account.id)}
                      title={account.status === "ACTIVE" ? "Archive" : "Restore"}
                    >
                      <Archive size={15} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.deleteIconBtn}`}
                      onClick={() => handleDeleteAccount(account.id)}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* Modal: Create or Edit Account */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? "Edit Trading Account" : "Create New Trading Account"}
        maxWidth="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAccount}>
              {editingAccount ? "Save Changes" : "Create Account"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAccount} className={styles.modalForm}>
          <Input
            label="Account Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apex 50k Futures #2"
            required
          />

          <Input
            label="Broker / Prop Firm Name"
            value={brokerName}
            onChange={(e) => setBrokerName(e.target.value)}
            placeholder="e.g. Tradovate, Interactive Brokers, NinjaTrader"
            required
          />

          <div className={styles.formGrid2}>
            <Select
              label="Account Category"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              options={accountTypeOptions}
            />

            <Select
              label="Asset Class"
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value as AssetClass)}
              options={assetClassOptions}
            />
          </div>

          <div className={styles.formGrid2}>
            <Input
              label="Initial Starting Balance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              disabled={!!editingAccount}
              helperText={
                editingAccount ? "Initial balance locked after account creation" : undefined
              }
              required
            />

            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={currencyOptions}
            />
          </div>

          <Input
            label="Description / Purpose (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. NQ breakout evaluation challenge"
          />
        </form>
      </Modal>
    </AppShell>
  );
}
