"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import styles from "./Import.module.css";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  TradingAccount,
  ImportPreviewResult,
  ImportBatch,
} from "@/types";
import {
  BROKER_PRESETS,
  ColumnMapping,
  detectBrokerPreset,
  autoMatchColumns,
} from "@/lib/importers/broker-adapters";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Download,
  Check,
  XCircle,
  Clock,
  Layers,
  Plus,
  RefreshCw,
  LogIn,
  TableProperties,
} from "lucide-react";

export default function ImportTradesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isAccountsLoading, setIsAccountsLoading] = useState<boolean>(true);
  const [isUnauthenticated, setIsUnauthenticated] = useState<boolean>(false);
  const [brokerPreset, setBrokerPreset] = useState<string>("auto");

  // File & Content
  const [fileName, setFileName] = useState<string>("");
  const [fileSizeText, setFileSizeText] = useState<string>("");
  const [csvContent, setCsvContent] = useState<string>("");
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [rawSampleRows, setRawSampleRows] = useState<Record<string, string>[]>([]);
  const [totalDetectedRows, setTotalDetectedRows] = useState<number>(0);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(
    BROKER_PRESETS.universal.defaultMapping
  );

  // Quick Account Modal
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState<boolean>(false);
  const [newAccountName, setNewAccountName] = useState<string>("Primary Trading Account");
  const [newAccountBroker, setNewAccountBroker] = useState<string>("Interactive Brokers");
  const [newAccountType, setNewAccountType] = useState<string>("CASH");
  const [newAssetClass, setNewAssetClass] = useState<string>("STOCKS");
  const [newInitialBalance, setNewInitialBalance] = useState<number>(10000);
  const [isCreatingAccount, setIsCreatingAccount] = useState<boolean>(false);

  // Preview & Processing
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ingestion Result
  const [importReport, setImportReport] = useState<{
    batch: ImportBatch;
    importedCount: number;
    duplicateCount: number;
    failedCount: number;
  } | null>(null);

  // History & Revert
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [revertTarget, setRevertTarget] = useState<ImportBatch | null>(null);
  const [isReverting, setIsReverting] = useState<boolean>(false);

  // Fetch Accounts & Import History on Mount
  useEffect(() => {
    fetchAccounts();
    fetchHistory();
  }, []);

  const fetchAccounts = async () => {
    setIsAccountsLoading(true);
    try {
      const res = await fetch("/api/v1/accounts");
      if (res.status === 401) {
        setIsUnauthenticated(true);
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        setAccounts(json.data);
        if (json.data.length > 0) {
          setSelectedAccountId((prev) => (prev ? prev : json.data[0].id));
        }
      }
    } catch {
      setErrorMessage("Failed to load trading accounts.");
    } finally {
      setIsAccountsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/v1/trades/import/history");
      const json = await res.json();
      if (json.success && json.data) {
        setHistory(json.data);
      }
    } catch {
      // Non-critical, ignore
    }
  };

  // Quick Create Account Handler
  const handleCreateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsCreatingAccount(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAccountName || "Primary Trading Account",
          brokerName: newAccountBroker || "General Broker",
          accountType: newAccountType || "CASH",
          assetClass: newAssetClass || "STOCKS",
          initialBalance: Number(newInitialBalance) || 10000,
          currency: "USD",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create account");
      }

      const created = json.data as TradingAccount;
      setAccounts((prev) => [created, ...prev]);
      setSelectedAccountId(created.id);
      setIsCreateAccountModalOpen(false);
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      setErrorMessage(msg);
      return null;
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle File Drop / Selection with PapaParse
  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      setErrorMessage("Please select a valid CSV file (.csv or .txt).");
      return;
    }

    setFileName(file.name);
    setFileSizeText(formatBytes(file.size));

    const reader = new FileReader();
    reader.onload = (e) => {
      let content = (e.target?.result as string) || "";
      // Strip UTF-8 Byte Order Mark if present
      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }
      setCsvContent(content);

      try {
        const parsed = Papa.parse<Record<string, string>>(content.trim(), {
          header: true,
          skipEmptyLines: "greedy",
          delimitersToGuess: [",", "\t", "|", ";"],
          transformHeader: (h) => h.trim().replace(/^["']|["']$/g, ""),
        });

        const headers = parsed.meta.fields
          ? parsed.meta.fields.filter((h) => h && h.trim().length > 0)
          : [];

        if (headers.length === 0) {
          setErrorMessage("No column headers detected in this CSV file. Please ensure line 1 contains valid column titles.");
          return;
        }

        setDetectedHeaders(headers);

        const validRows = parsed.data.filter((row) =>
          Object.values(row).some((val) => val && String(val).trim() !== "")
        );
        setTotalDetectedRows(validRows.length);
        setRawSampleRows(validRows.slice(0, 3));

        // Intelligent auto-mapping
        const mapping = autoMatchColumns(headers, brokerPreset);
        setColumnMapping(mapping);

        // Auto-detect preset if in auto mode
        if (brokerPreset === "auto") {
          const detectedPresetId = detectBrokerPreset(headers);
          if (detectedPresetId !== "universal") {
            setBrokerPreset(detectedPresetId);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error parsing CSV";
        setErrorMessage(`CSV parsing error: ${msg}`);
      }
    };

    reader.readAsText(file);
  };

  const handlePresetSelect = (presetId: string) => {
    setBrokerPreset(presetId);
    if (detectedHeaders.length > 0) {
      const mapping = autoMatchColumns(detectedHeaders, presetId);
      setColumnMapping(mapping);
    }
  };

  // Step 1 -> Step 2
  const handleProceedToMapping = async () => {
    if (!csvContent) {
      setErrorMessage("Please select or drop a CSV file to continue.");
      return;
    }

    let targetAccountId = selectedAccountId;

    // If no account exists or none is selected, auto-create one or prompt
    if (!targetAccountId) {
      if (accounts.length > 0) {
        targetAccountId = accounts[0].id;
        setSelectedAccountId(targetAccountId);
      } else {
        // Auto-provision a default account so user is never blocked!
        const created = await handleCreateAccount();
        if (!created) {
          setIsCreateAccountModalOpen(true);
          setErrorMessage("Please create a trading account to store your imported trades.");
          return;
        }
        targetAccountId = created.id;
      }
    }

    setErrorMessage(null);
    setStep(2);
  };

  // Step 2 -> Step 3: Fetch Preview
  const handleGeneratePreview = async () => {
    setIsLoadingPreview(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/trades/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          fileName,
          csvContent,
          brokerPreset,
          customMapping: columnMapping,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to generate preview");
      }

      setPreviewResult(json.data);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating preview";
      setErrorMessage(msg);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Step 3 -> Step 4: Execute Ingestion
  const handleExecuteImport = async () => {
    setIsImporting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/trades/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          fileName,
          csvContent,
          brokerPreset,
          customMapping: columnMapping,
          skipDuplicates,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to execute import");
      }

      setImportReport(json.data);
      setStep(4);
      fetchHistory(); // Refresh history table
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error importing trades";
      setErrorMessage(msg);
    } finally {
      setIsImporting(false);
    }
  };

  // Batch Revert Handler
  const handleRevertConfirm = async () => {
    if (!revertTarget) return;
    setIsReverting(true);
    try {
      const res = await fetch(`/api/v1/trades/import/${revertTarget.id}/revert`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to rollback batch");
      }

      setRevertTarget(null);
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error rolling back batch";
      alert(msg);
    } finally {
      setIsReverting(false);
    }
  };

  const handleDownloadTemplate = (brokerKey: string) => {
    window.open(`/api/v1/trades/import/template?broker=${brokerKey}`, "_blank");
  };

  const resetWizard = () => {
    setStep(1);
    setFileName("");
    setFileSizeText("");
    setCsvContent("");
    setDetectedHeaders([]);
    setRawSampleRows([]);
    setTotalDetectedRows(0);
    setPreviewResult(null);
    setImportReport(null);
    setErrorMessage(null);
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>CSV Trade Importer</h1>
          <p className={styles.subtitle}>
            Bulk import executions and closed trades from Tradovate, ThinkorSwim, NinjaTrader, MetaTrader, IBKR, or custom CSV
          </p>
        </div>
        <div className={styles.headerRight}>
          <Link href="/trades">
            <Button variant="secondary">Back to Journal</Button>
          </Link>
        </div>
      </div>

      {/* 4-Step Stepper Header */}
      <div className={styles.stepper}>
        <div className={styles.stepItem}>
          <div
            className={`${styles.stepNumber} ${
              step === 1 ? styles.stepNumberActive : step > 1 ? styles.stepNumberCompleted : ""
            }`}
          >
            {step > 1 ? <Check size={16} /> : "1"}
          </div>
          <div className={styles.stepText}>
            <span className={`${styles.stepTitle} ${step === 1 ? styles.stepTitleActive : ""}`}>
              Upload & Account
            </span>
          </div>
        </div>

        <div className={`${styles.stepDivider} ${step > 1 ? styles.stepDividerActive : ""}`} />

        <div className={styles.stepItem}>
          <div
            className={`${styles.stepNumber} ${
              step === 2 ? styles.stepNumberActive : step > 2 ? styles.stepNumberCompleted : ""
            }`}
          >
            {step > 2 ? <Check size={16} /> : "2"}
          </div>
          <div className={styles.stepText}>
            <span className={`${styles.stepTitle} ${step === 2 ? styles.stepTitleActive : ""}`}>
              Column Mapping
            </span>
          </div>
        </div>

        <div className={`${styles.stepDivider} ${step > 2 ? styles.stepDividerActive : ""}`} />

        <div className={styles.stepItem}>
          <div
            className={`${styles.stepNumber} ${
              step === 3 ? styles.stepNumberActive : step > 3 ? styles.stepNumberCompleted : ""
            }`}
          >
            {step > 3 ? <Check size={16} /> : "3"}
          </div>
          <div className={styles.stepText}>
            <span className={`${styles.stepTitle} ${step === 3 ? styles.stepTitleActive : ""}`}>
              Validation Preview
            </span>
          </div>
        </div>

        <div className={`${styles.stepDivider} ${step > 3 ? styles.stepDividerActive : ""}`} />

        <div className={styles.stepItem}>
          <div
            className={`${styles.stepNumber} ${
              step === 4 ? styles.stepNumberCompleted : ""
            }`}
          >
            4
          </div>
          <div className={styles.stepText}>
            <span className={`${styles.stepTitle} ${step === 4 ? styles.stepTitleActive : ""}`}>
              Confirmation
            </span>
          </div>
        </div>
      </div>

      {/* Unauthenticated Alert Banner */}
      {isUnauthenticated && (
        <div className={styles.accountNoticeBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LogIn size={18} />
            <span>You are not logged in. Log in to save imported trades into your personal trading journal.</span>
          </div>
          <Link href="/login">
            <Button size="sm" variant="primary">
              Log In Now
            </Button>
          </Link>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--brand-crimson)", borderRadius: "var(--radius-md)", color: "var(--brand-crimson)", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Upload & Account Selection */}
      {step === 1 && (
        <div className={styles.card}>
          <div className={styles.uploadSection}>
            {/* Account Notice if zero accounts */}
            {!isAccountsLoading && accounts.length === 0 && !isUnauthenticated && (
              <div className={styles.accountNoticeBanner}>
                <div>
                  <strong>No Trading Accounts Found:</strong> You need an account to assign your imported trades.
                </div>
                <Button size="sm" variant="secondary" onClick={() => setIsCreateAccountModalOpen(true)}>
                  <Plus size={14} style={{ marginRight: "4px" }} /> Create Trading Account
                </Button>
              </div>
            )}

            <div className={styles.formGrid}>
              <div>
                <Select
                  label="Target Trading Account"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  options={
                    accounts.length > 0
                      ? accounts.map((a) => ({
                          value: a.id,
                          label: `${a.name} (${a.brokerName} - ${a.assetClass})`,
                        }))
                      : [{ value: "", label: "-- Create or select an account below --" }]
                  }
                />
                {accounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCreateAccountModalOpen(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--brand-blue)",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: "4px 0",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Plus size={12} /> Add another account
                  </button>
                )}
              </div>

              <Select
                label="Broker Format Preset"
                value={brokerPreset}
                onChange={(e) => handlePresetSelect(e.target.value)}
                options={[
                  { value: "auto", label: "Auto-Detect from CSV Headers (Recommended)" },
                  { value: "universal", label: "Universal / TradePulse Standard" },
                  { value: "tradovate", label: "Tradovate (Futures)" },
                  { value: "thinkorswim", label: "ThinkorSwim / Schwab" },
                  { value: "ninjatrader", label: "NinjaTrader 8" },
                  { value: "metatrader", label: "MetaTrader 4 / 5" },
                  { value: "interactivebrokers", label: "Interactive Brokers" },
                ]}
              />
            </div>

            {/* Drop Zone */}
            <div
              className={styles.dropZone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                    e.target.value = ""; // Reset so same file can be re-selected
                  }
                }}
              />
              <UploadCloud className={styles.dropIcon} />
              <div>
                <p className={styles.dropText}>Click or drag & drop broker CSV file here</p>
                <p className={styles.dropSubtext}>Supports CSV up to 10MB (UTF-8, comma, semicolon, tab)</p>
              </div>

              {fileName && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div className={styles.fileSelectedBadge}>
                    <FileSpreadsheet size={16} />
                    <span>{fileName} {fileSizeText && <span style={{ opacity: 0.75 }}>({fileSizeText})</span>}</span>
                    <Badge variant="success">Parsed Successfully</Badge>
                  </div>
                  {totalDetectedRows > 0 && (
                    <div className={styles.fileMetaInfo}>
                      <Badge variant="info">{totalDetectedRows} trades detected</Badge>
                      <Badge variant="neutral">{detectedHeaders.length} columns identified</Badge>
                      {brokerPreset !== "auto" && (
                        <Badge variant="warning">Preset: {brokerPreset.toUpperCase()}</Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Download Templates Bar */}
            <div className={styles.templatesSection}>
              <span className={styles.templatesTitle}>Download Sample Format Templates:</span>
              <div className={styles.templateButtons}>
                {Object.values(BROKER_PRESETS).map((preset) => (
                  <Button
                    key={preset.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadTemplate(preset.id)}
                  >
                    <Download size={14} style={{ marginRight: "6px" }} />
                    {preset.name.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsBar}>
              <Button
                variant="primary"
                onClick={handleProceedToMapping}
                disabled={!csvContent}
              >
                Configure Mapping <ArrowRight size={16} style={{ marginLeft: "8px" }} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && (
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--text-primary)" }}>
                Reconcile & Map Columns
              </h2>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>
                Verify and fine-tune your CSV headers mapped to TradePulse trade engine fields.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Badge variant="info">Preset: {brokerPreset.toUpperCase()}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const refreshed = autoMatchColumns(detectedHeaders, brokerPreset);
                  setColumnMapping(refreshed);
                }}
              >
                <RefreshCw size={14} style={{ marginRight: "6px" }} /> Reset Auto-Mapping
              </Button>
            </div>
          </div>

          {/* Raw CSV Sample Preview Table */}
          {rawSampleRows.length > 0 && (
            <div className={styles.rawSampleCard}>
              <div className={styles.rawSampleTitle}>
                <TableProperties size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                Uploaded CSV Data Sample (First {rawSampleRows.length} Rows):
              </div>
              <div className={styles.previewTableWrapper} style={{ maxHeight: "160px" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {detectedHeaders.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawSampleRows.map((row, idx) => (
                      <tr key={idx}>
                        {detectedHeaders.map((header) => (
                          <td key={header}>{row[header] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className={styles.mappingGrid}>
            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>
                Symbol / Contract <span className={styles.requiredStar}>*</span>
              </label>
              <Select
                value={columnMapping.symbolColumn}
                onChange={(e) => setColumnMapping({ ...columnMapping, symbolColumn: e.target.value })}
                options={detectedHeaders.map((h) => ({ value: h, label: h }))}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>
                Direction / Action / Side <span className={styles.requiredStar}>*</span>
              </label>
              <Select
                value={columnMapping.directionColumn}
                onChange={(e) => setColumnMapping({ ...columnMapping, directionColumn: e.target.value })}
                options={detectedHeaders.map((h) => ({ value: h, label: h }))}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>
                Entry Timestamp <span className={styles.requiredStar}>*</span>
              </label>
              <Select
                value={columnMapping.entryTimeColumn}
                onChange={(e) => setColumnMapping({ ...columnMapping, entryTimeColumn: e.target.value })}
                options={detectedHeaders.map((h) => ({ value: h, label: h }))}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>
                Entry Price <span className={styles.requiredStar}>*</span>
              </label>
              <Select
                value={columnMapping.entryPriceColumn}
                onChange={(e) => setColumnMapping({ ...columnMapping, entryPriceColumn: e.target.value })}
                options={detectedHeaders.map((h) => ({ value: h, label: h }))}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>
                Quantity / Size <span className={styles.requiredStar}>*</span>
              </label>
              <Select
                value={columnMapping.quantityColumn}
                onChange={(e) => setColumnMapping({ ...columnMapping, quantityColumn: e.target.value })}
                options={detectedHeaders.map((h) => ({ value: h, label: h }))}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>Exit Timestamp (Optional)</label>
              <Select
                value={columnMapping.exitTimeColumn || ""}
                onChange={(e) => setColumnMapping({ ...columnMapping, exitTimeColumn: e.target.value || undefined })}
                options={[{ value: "", label: "-- None / Not in CSV --" }, ...detectedHeaders.map((h) => ({ value: h, label: h }))]}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>Exit Price (Optional)</label>
              <Select
                value={columnMapping.exitPriceColumn || ""}
                onChange={(e) => setColumnMapping({ ...columnMapping, exitPriceColumn: e.target.value || undefined })}
                options={[{ value: "", label: "-- None / Not in CSV --" }, ...detectedHeaders.map((h) => ({ value: h, label: h }))]}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>Fees / Commissions (Optional)</label>
              <Select
                value={columnMapping.feesColumn || ""}
                onChange={(e) => setColumnMapping({ ...columnMapping, feesColumn: e.target.value || undefined })}
                options={[{ value: "", label: "-- None / Not in CSV --" }, ...detectedHeaders.map((h) => ({ value: h, label: h }))]}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>Contract Multiplier (Optional)</label>
              <Select
                value={columnMapping.contractMultiplierColumn || ""}
                onChange={(e) => setColumnMapping({ ...columnMapping, contractMultiplierColumn: e.target.value || undefined })}
                options={[{ value: "", label: "-- None / Not in CSV --" }, ...detectedHeaders.map((h) => ({ value: h, label: h }))]}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>Stop Loss (Optional)</label>
              <Select
                value={columnMapping.stopLossColumn || ""}
                onChange={(e) => setColumnMapping({ ...columnMapping, stopLossColumn: e.target.value || undefined })}
                options={[{ value: "", label: "-- None / Not in CSV --" }, ...detectedHeaders.map((h) => ({ value: h, label: h }))]}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>Take Profit (Optional)</label>
              <Select
                value={columnMapping.takeProfitColumn || ""}
                onChange={(e) => setColumnMapping({ ...columnMapping, takeProfitColumn: e.target.value || undefined })}
                options={[{ value: "", label: "-- None / Not in CSV --" }, ...detectedHeaders.map((h) => ({ value: h, label: h }))]}
              />
            </div>

            <div className={styles.fieldMapItem}>
              <label className={styles.fieldLabel}>Notes / Comments (Optional)</label>
              <Select
                value={columnMapping.notesColumn || ""}
                onChange={(e) => setColumnMapping({ ...columnMapping, notesColumn: e.target.value || undefined })}
                options={[{ value: "", label: "-- None / Not in CSV --" }, ...detectedHeaders.map((h) => ({ value: h, label: h }))]}
              />
            </div>
          </div>

          <div className={styles.actionsBar}>
            <Button variant="secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} style={{ marginRight: "8px" }} /> Back
            </Button>
            <Button variant="primary" onClick={handleGeneratePreview} isLoading={isLoadingPreview}>
              Validate & Preview <ArrowRight size={16} style={{ marginLeft: "8px" }} />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Validation */}
      {step === 3 && previewResult && (
        <div className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <div>
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--text-primary)" }}>
                Validation & Deduplication Audit
              </h2>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>
                Review parsed records before committing to your journal database.
              </p>
            </div>
          </div>

          {/* Validation Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Parsed Rows</span>
              <span className={styles.statValue}>{previewResult.totalRows}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Valid & Ready</span>
              <span className={`${styles.statValue} ${styles.statValid}`}>{previewResult.validRows}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Duplicates Detected</span>
              <span className={`${styles.statValue} ${styles.statDuplicate}`}>{previewResult.duplicateRows}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Invalid / Errors</span>
              <span className={`${styles.statValue} ${styles.statInvalid}`}>{previewResult.invalidRows}</span>
            </div>
          </div>

          {/* Deduplication Switch */}
          <div className={styles.optionsRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              <span>
                <strong>Skip Duplicate Executions Automatically</strong> (Prevents re-importing already recorded fills)
              </span>
            </label>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Fingerprint SHA-256 Enabled
            </span>
          </div>

          {/* Sample Table */}
          <div className={styles.previewTableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Status</th>
                  <th>Symbol</th>
                  <th>Direction</th>
                  <th>Entry Time</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>Quantity</th>
                  <th>Fees</th>
                  <th>Estimated P&L</th>
                </tr>
              </thead>
              <tbody>
                {previewResult.sampleRows.slice(0, 100).map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={
                      !row.isValid
                        ? styles.tableRowInvalid
                        : row.isDuplicate
                        ? styles.tableRowDuplicate
                        : ""
                    }
                  >
                    <td>#{row.rowIndex}</td>
                    <td>
                      {!row.isValid ? (
                        <Badge variant="danger" title={row.validationError}>
                          <XCircle size={12} style={{ marginRight: "4px" }} />
                          {row.validationError || "Invalid"}
                        </Badge>
                      ) : row.isDuplicate ? (
                        <Badge variant="warning">
                          <AlertTriangle size={12} style={{ marginRight: "4px" }} />
                          Duplicate
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <Check size={12} style={{ marginRight: "4px" }} />
                          Valid
                        </Badge>
                      )}
                    </td>
                    <td><strong>{row.symbol}</strong></td>
                    <td>
                      <Badge variant={row.direction === "LONG" ? "success" : "danger"}>
                        {row.direction}
                      </Badge>
                    </td>
                    <td>{new Date(row.entryTime).toLocaleString("en-US")}</td>
                    <td>${row.entryPrice.toFixed(2)}</td>
                    <td>{row.exitPrice ? `$${row.exitPrice.toFixed(2)}` : "-"}</td>
                    <td>{row.quantity}</td>
                    <td>${(row.fees + row.commissions).toFixed(2)}</td>
                    <td>
                      {row.netPnl !== undefined ? (
                        <span style={{ color: row.netPnl >= 0 ? "var(--brand-emerald)" : "var(--brand-crimson)", fontWeight: 600 }}>
                          ${row.netPnl >= 0 ? "+" : ""}{row.netPnl.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Open</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.actionsBar}>
            <Button variant="secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={16} style={{ marginRight: "8px" }} /> Back to Mapping
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteImport}
              isLoading={isImporting}
              disabled={previewResult.validRows === 0}
            >
              Commit & Import {skipDuplicates ? previewResult.validRows : previewResult.validRows + previewResult.duplicateRows} Trades
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Ingestion Report */}
      {step === 4 && importReport && (
        <div className={styles.card}>
          <div className={styles.successContainer}>
            <CheckCircle2 className={styles.successIcon} />
            <h2 className={styles.successTitle}>Import Completed Successfully!</h2>
            <p className={styles.subtitle}>
              Your trade executions have been committed to TradePulse with mathematical precision and account balance reconciliation.
            </p>

            <div className={styles.statsGrid} style={{ width: "100%", maxWidth: "600px", margin: "var(--space-6) 0" }}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Trades Ingested</span>
                <span className={`${styles.statValue} ${styles.statValid}`}>
                  {importReport.importedCount}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Duplicates Skipped</span>
                <span className={`${styles.statValue} ${styles.statDuplicate}`}>
                  {importReport.duplicateCount}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Failed Rows</span>
                <span className={`${styles.statValue} ${styles.statInvalid}`}>
                  {importReport.failedCount}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <Button variant="secondary" onClick={resetWizard}>
                Import Another File
              </Button>
              <Link href="/trades">
                <Button variant="primary">
                  View Trades in Journal <ArrowRight size={16} style={{ marginLeft: "8px" }} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Historical Imports Section */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h2>Import History & Audit Log</h2>
          <Button variant="ghost" size="sm" onClick={fetchHistory}>
            <RotateCcw size={14} style={{ marginRight: "6px" }} /> Refresh
          </Button>
        </div>

        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          {history.length === 0 ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-muted)" }}>
              <Layers size={36} style={{ margin: "0 auto var(--space-2)", opacity: 0.5 }} />
              <p>No previous import batches recorded.</p>
            </div>
          ) : (
            <div className={styles.previewTableWrapper} style={{ border: "none" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>File Name</th>
                    <th>Broker Preset</th>
                    <th>Total Rows</th>
                    <th>Imported</th>
                    <th>Duplicates</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((batch) => (
                    <tr key={batch.id}>
                      <td><code>{batch.id}</code></td>
                      <td>{batch.fileName}</td>
                      <td><Badge variant="neutral">{batch.brokerPreset.toUpperCase()}</Badge></td>
                      <td>{batch.totalRows}</td>
                      <td><strong style={{ color: "var(--brand-emerald)" }}>{batch.importedCount}</strong></td>
                      <td>{batch.duplicateCount}</td>
                      <td>
                        <Badge variant={batch.status === "COMPLETED" ? "success" : "danger"}>
                          {batch.status}
                        </Badge>
                      </td>
                      <td>{new Date(batch.createdAt).toLocaleString("en-US")}</td>
                      <td>
                        {batch.status === "COMPLETED" && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setRevertTarget(batch)}
                          >
                            Rollback
                          </Button>
                        )}
                        {batch.status === "REVERTED" && (
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Reverted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Create Account Modal */}
      <Modal
        isOpen={isCreateAccountModalOpen}
        onClose={() => setIsCreateAccountModalOpen(false)}
        title="Create Trading Account"
      >
        <form onSubmit={handleCreateAccount} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>
            Create an account to track your balance and organize your imported trades.
          </p>

          <Input
            label="Account Name"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="e.g. Tradovate 50K Prop, IBKR Live"
            required
          />

          <Input
            label="Broker / Platform"
            value={newAccountBroker}
            onChange={(e) => setNewAccountBroker(e.target.value)}
            placeholder="e.g. Tradovate, NinjaTrader, Schwab"
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <Select
              label="Account Type"
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value)}
              options={[
                { value: "CASH", label: "Cash" },
                { value: "MARGIN", label: "Margin" },
                { value: "PROP_EVALUATION", label: "Prop Evaluation" },
                { value: "PROP_FUNDED", label: "Prop Funded" },
                { value: "DEMO", label: "Demo / Paper" },
              ]}
            />

            <Select
              label="Primary Asset Class"
              value={newAssetClass}
              onChange={(e) => setNewAssetClass(e.target.value)}
              options={[
                { value: "STOCKS", label: "Stocks / Equities" },
                { value: "FUTURES", label: "Futures" },
                { value: "FOREX", label: "Forex" },
                { value: "CRYPTO", label: "Crypto" },
                { value: "OPTIONS", label: "Options" },
                { value: "CFDS", label: "CFDs" },
              ]}
            />
          </div>

          <Input
            label="Starting Balance (USD)"
            type="number"
            value={newInitialBalance}
            onChange={(e) => setNewInitialBalance(Number(e.target.value))}
            min={0}
            step="any"
            required
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateAccountModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingAccount}>
              Create & Select Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revert Batch Confirmation Modal */}
      <Modal
        isOpen={!!revertTarget}
        onClose={() => setRevertTarget(null)}
        title="Confirm Batch Rollback"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>
            Are you sure you want to rollback import batch <strong>{revertTarget?.id}</strong> ({revertTarget?.fileName})?
          </p>
          <div style={{ padding: "var(--space-3)", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--brand-crimson)", borderRadius: "var(--radius-md)", color: "var(--brand-crimson)", fontSize: "13px" }}>
            This will permanently delete all <strong>{revertTarget?.tradeIds.length}</strong> trades created during this import and automatically reverse their account balance adjustments.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <Button variant="secondary" onClick={() => setRevertTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRevertConfirm} isLoading={isReverting}>
              Rollback Batch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
