"use client";

import React, { useState } from "react";
import styles from "./AppShell.module.css";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState("all");
  const [dateRange, setDateRange] = useState("last30days");
  const [isDemoUser, setIsDemoUser] = useState(false);

  React.useEffect(() => {
    fetch("/api/v1/user/profile")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json?.success && json?.data) {
          if (json.data.id === "usr_sample_demo" || json.data.email === "demo@tradepulse.io") {
            setIsDemoUser(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleAddTradeClick = () => {
    // In Phase 1, trigger a friendly toast/alert to confirm shell interactivity
    alert("Phase 1 verified: Add Trade modal trigger connected to AppShell.");
  };

  return (
    <div className={styles.appShell}>
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className={styles.mainContainer}>
        {isDemoUser && (
          <div
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
              padding: "8px 16px",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#f59e0b",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚡</span>
              <span>
                <strong>Sample Demo Account:</strong> You are exploring simulated trading performance data in an isolated sandbox. Real accounts start with clean personal data.
              </span>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <a
                href="/register"
                style={{
                  backgroundColor: "#f59e0b",
                  color: "#000",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontWeight: 600,
                  fontSize: "12px",
                  textDecoration: "none",
                }}
              >
                Start Free Trial
              </a>
              <a
                href="/login"
                style={{
                  color: "inherit",
                  textDecoration: "underline",
                  fontSize: "12px",
                }}
              >
                Sign In
              </a>
            </div>
          </div>
        )}

        <TopBar
          onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
          onAddTradeClick={handleAddTradeClick}
          selectedAccountId={activeAccount}
          onAccountChange={setActiveAccount}
          selectedDateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <main className={styles.contentWorkspace}>
          <div className={styles.contentInner}>{children}</div>
        </main>
      </div>
    </div>
  );
};
