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
