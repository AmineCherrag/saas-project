"use client";

import React, { useState, useEffect } from "react";
import styles from "./AddTradeModal.module.css";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  TradeDirection,
  TradeStatus,
  AssetClass,
  TradingAccount,
} from "@/types";
import {
  calculateTradeMetrics,
  getContractMultiplier,
} from "@/lib/trade-engine/calculations";
import { TrendingUp, TrendingDown, Calculator, Star, Tag, AlertCircle } from "lucide-react";

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeCreated?: (trade: any) => void;
  accounts?: TradingAccount[];
}

export const AddTradeModal: React.FC<AddTradeModalProps> = ({
  isOpen,
  onClose,
  onTradeCreated,
  accounts = [],
}) => {
  // Form State
  const [accountId, setAccountId] = useState("");
  const [symbol, setSymbol] = useState("NQ");
  const [assetClass, setAssetClass] = useState<AssetClass>("FUTURES");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [status, setStatus] = useState<TradeStatus>("CLOSED");

  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");

  const [entryPrice, setEntryPrice] = useState("18250.00");
  const [exitPrice, setExitPrice] = useState("18275.50");
  const [quantity, setQuantity] = useState("2");
  const [contractMultiplier, setContractMultiplier] = useState("20");

  const [stopLoss, setStopLoss] = useState("18230.00");
  const [takeProfit, setTakeProfit] = useState("18290.00");
  const [fees, setFees] = useState("8.50");
  const [commissions, setCommissions] = useState("4.00");

  const [playbookName, setPlaybookName] = useState("NY Open Breakout");
  const [marketSession, setMarketSession] = useState("NY Open");
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [tagInput, setTagInput] = useState("A+ Setup, Followed Plan");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Set default account and timestamps on open
  useEffect(() => {
    if (isOpen) {
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
      const now = new Date();
      const isoNow = now.toISOString().slice(0, 16);
      setEntryTime(isoNow);
      setExitTime(isoNow);
    }
  }, [isOpen, accounts, accountId]);

  // Auto-detect multiplier when asset class or symbol changes
  useEffect(() => {
    const autoMultiplier = getContractMultiplier(assetClass, symbol);
    setContractMultiplier(autoMultiplier.toString());
  }, [assetClass, symbol]);

  // Live Metric Preview Calculation
  const numEntry = parseFloat(entryPrice) || 0;
  const numExit = status === "CLOSED" ? parseFloat(exitPrice) || undefined : undefined;
  const numQty = parseFloat(quantity) || 0;
  const numMult = parseFloat(contractMultiplier) || 1;
  const numFees = parseFloat(fees) || 0;
  const numComm = parseFloat(commissions) || 0;
  const numStop = parseFloat(stopLoss) || undefined;
  const numTarget = parseFloat(takeProfit) || undefined;

  const liveMetrics = calculateTradeMetrics({
    direction,
    entryPrice: numEntry,
    exitPrice: numExit,
    quantity: numQty,
    contractMultiplier: numMult,
    fees: numFees,
    commissions: numComm,
    stopLoss: numStop,
    takeProfit: numTarget,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const tagsArray = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => ({ type: "SETUP" as const, value: t }));

      const payload = {
        accountId: accountId || (accounts[0]?.id ?? "acc_101"),
        symbol: symbol.toUpperCase(),
        assetClass,
        direction,
        status,
        entryTime: new Date(entryTime).toISOString(),
        exitTime: status === "CLOSED" ? new Date(exitTime).toISOString() : undefined,
        entryPrice: numEntry,
        exitPrice: numExit,
        quantity: numQty,
        contractMultiplier: numMult,
        stopLoss: numStop,
        takeProfit: numTarget,
        fees: numFees,
        commissions: numComm,
        playbookName,
        marketSession,
        rating,
        notes,
        tags: tagsArray,
      };

      const res = await fetch("/api/v1/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to log trade.");
      }

      if (onTradeCreated) {
        onTradeCreated(data.data);
      }

      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating trade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log New Trade"
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={isLoading}
            onClick={handleSubmit}
          >
            Save Trade Record
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {errorMessage && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Account & Direction Header */}
        <div className={styles.topControlRow}>
          <div className={styles.accountSelector}>
            <label className={styles.fieldLabel}>Trading Portfolio</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={styles.styledSelect}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.brokerName} - {acc.currency})
                </option>
              ))}
              {accounts.length === 0 && (
                <option value="acc_101">Primary Prop Account (Tradovate)</option>
              )}
            </select>
          </div>

          {/* Direction Toggle */}
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.dirBtn} ${direction === "LONG" ? styles.activeLong : ""}`}
              onClick={() => setDirection("LONG")}
            >
              <TrendingUp size={15} />
              <span>LONG</span>
            </button>
            <button
              type="button"
              className={`${styles.dirBtn} ${direction === "SHORT" ? styles.activeShort : ""}`}
              onClick={() => setDirection("SHORT")}
            >
              <TrendingDown size={15} />
              <span>SHORT</span>
            </button>
          </div>

          {/* Status Toggle */}
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.statusBtn} ${status === "CLOSED" ? styles.activeStatus : ""}`}
              onClick={() => setStatus("CLOSED")}
            >
              CLOSED
            </button>
            <button
              type="button"
              className={`${styles.statusBtn} ${status === "OPEN" ? styles.activeStatus : ""}`}
              onClick={() => setStatus("OPEN")}
            >
              OPEN
            </button>
          </div>
        </div>

        {/* 2. Symbol & Asset Class */}
        <div className={styles.gridRow3}>
          <Input
            label="Symbol / Ticker"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g. NQ, ES, AAPL, BTC"
            required
          />

          <Select
            label="Asset Class"
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value as AssetClass)}
            options={[
              { value: "FUTURES", label: "Futures" },
              { value: "STOCKS", label: "Equities / Stocks" },
              { value: "OPTIONS", label: "Options" },
              { value: "CRYPTO", label: "Crypto" },
              { value: "FOREX", label: "Forex" },
              { value: "CFDS", label: "CFDs" },
            ]}
          />

          <Input
            label="Contract Multiplier"
            type="number"
            step="any"
            value={contractMultiplier}
            onChange={(e) => setContractMultiplier(e.target.value)}
            helperText="Auto-computed point/contract multiplier"
            required
          />
        </div>

        {/* 3. Execution Prices & Timestamps */}
        <div className={styles.gridRow4}>
          <Input
            label="Entry Price"
            type="number"
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            required
          />

          {status === "CLOSED" && (
            <Input
              label="Exit Price"
              type="number"
              step="any"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              required
            />
          )}

          <Input
            label="Quantity / Contracts"
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <Input
            label="Entry Timestamp"
            type="datetime-local"
            value={entryTime}
            onChange={(e) => setEntryTime(e.target.value)}
            required
          />
        </div>

        {/* 4. Risk & Target Levels */}
        <div className={styles.gridRow4}>
          <Input
            label="Stop-Loss Price"
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="e.g. 18230.00"
          />

          <Input
            label="Take-Profit Price"
            type="number"
            step="any"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="e.g. 18290.00"
          />

          <Input
            label="Commissions ($)"
            type="number"
            step="any"
            value={commissions}
            onChange={(e) => setCommissions(e.target.value)}
          />

          <Input
            label="Exchange Fees ($)"
            type="number"
            step="any"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
          />
        </div>

        {/* 5. Live Calculation Preview Box */}
        <div className={styles.calcPreviewBox}>
          <div className={styles.calcHeader}>
            <Calculator size={15} />
            <span>REAL-TIME PERFORMANCE CALCULATOR</span>
          </div>

          <div className={styles.calcGrid}>
            <div className={styles.calcStat}>
              <span className={styles.calcStatLabel}>Gross P&L</span>
              <span
                className={liveMetrics.grossPnl >= 0 ? styles.calcProfit : styles.calcLoss}
              >
                {liveMetrics.grossPnl >= 0 ? "+" : ""}$
                {liveMetrics.grossPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.calcStat}>
              <span className={styles.calcStatLabel}>Net P&L (After Fees)</span>
              <span
                className={liveMetrics.netPnl >= 0 ? styles.calcProfit : styles.calcLoss}
              >
                {liveMetrics.netPnl >= 0 ? "+" : ""}$
                {liveMetrics.netPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.calcStat}>
              <span className={styles.calcStatLabel}>Initial Risk ($)</span>
              <span className={styles.calcNeutral}>
                {liveMetrics.initialRisk
                  ? `$${liveMetrics.initialRisk.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`
                  : "—"}
              </span>
            </div>

            <div className={styles.calcStat}>
              <span className={styles.calcStatLabel}>R-Multiple</span>
              <span
                className={
                  liveMetrics.rMultiple && liveMetrics.rMultiple > 0
                    ? styles.calcProfit
                    : styles.calcLoss
                }
              >
                {liveMetrics.rMultiple !== null
                  ? `${liveMetrics.rMultiple >= 0 ? "+" : ""}${liveMetrics.rMultiple} R`
                  : "—"}
              </span>
            </div>

            <div className={styles.calcStat}>
              <span className={styles.calcStatLabel}>Return %</span>
              <span
                className={
                  liveMetrics.returnPct && liveMetrics.returnPct >= 0
                    ? styles.calcProfit
                    : styles.calcLoss
                }
              >
                {liveMetrics.returnPct !== null
                  ? `${liveMetrics.returnPct >= 0 ? "+" : ""}${liveMetrics.returnPct}%`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Strategy, Rating & Tags */}
        <div className={styles.gridRow3}>
          <Input
            label="Playbook Strategy"
            value={playbookName}
            onChange={(e) => setPlaybookName(e.target.value)}
            placeholder="e.g. Liquidity Sweep, VWAP Cross"
          />

          <Select
            label="Trading Session"
            value={marketSession}
            onChange={(e) => setMarketSession(e.target.value)}
            options={[
              { value: "NY Open", label: "NY Open (09:30 - 11:30 AM)" },
              { value: "NY Midday", label: "NY Midday (11:30 - 01:30 PM)" },
              { value: "NY Close", label: "NY Close (01:30 - 04:00 PM)" },
              { value: "London", label: "London Session (03:00 - 08:00 AM)" },
              { value: "Asia", label: "Asian Session (07:00 PM - 02:00 AM)" },
            ]}
          />

          <div>
            <label className={styles.fieldLabel}>Trade Execution Rating</label>
            <div className={styles.starRating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`${styles.starBtn} ${rating >= star ? styles.starActive : ""}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        <Input
          label="Execution Tags (Comma-separated setups or mistakes)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="e.g. A+ Setup, Followed Plan, Chased Entry"
          leftAddon={<Tag size={15} />}
        />

        <div className={styles.textareaWrapper}>
          <label className={styles.fieldLabel}>Trade Notes & Debrief</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Document your setup thesis, market context, and execution thoughts..."
            className={styles.textarea}
          />
        </div>
      </form>
    </Modal>
  );
};
