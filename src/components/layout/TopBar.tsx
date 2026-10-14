"use client";

import React, { useState, useEffect } from "react";
import styles from "./TopBar.module.css";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Plus,
  UploadCloud,
  ChevronDown,
  Wallet,
  Calendar,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "../ui/Button";

interface TopBarProps {
  onMobileMenuToggle: () => void;
  onAddTradeClick?: () => void;
  selectedAccountId?: string;
  onAccountChange?: (accountId: string) => void;
  selectedDateRange?: string;
  onDateRangeChange?: (range: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMobileMenuToggle,
  onAddTradeClick,
  selectedAccountId = "all",
  onAccountChange,
  selectedDateRange = "last30days",
  onDateRangeChange,
}) => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Sync theme with document attribute
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const accounts = [
    { id: "all", label: "All Accounts (Aggregated)" },
    { id: "acc_101", label: "Apex 50k Evaluation (Futures)" },
    { id: "acc_102", label: "Interactive Brokers (Equities)" },
    { id: "acc_103", label: "Binance Live (Crypto)" },
  ];

  const dateRanges = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "this_week", label: "This Week" },
    { id: "last30days", label: "Last 30 Days" },
    { id: "month_to_date", label: "Month to Date" },
    { id: "year_to_date", label: "Year to Date" },
    { id: "all_time", label: "All Time" },
  ];

  return (
    <header className={styles.topBar}>
      {/* Left Section: Mobile Menu & Global Filters */}
      <div className={styles.leftSection}>
        <button
          className={styles.hamburgerBtn}
          onClick={onMobileMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Account Selector */}
        <div className={styles.filterControl}>
          <Wallet size={15} className={styles.filterIcon} />
          <select
            value={selectedAccountId}
            onChange={(e) => onAccountChange && onAccountChange(e.target.value)}
            className={styles.filterSelect}
            aria-label="Select Trading Account"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.chevronIcon} />
        </div>

        {/* Global Date Range Selector */}
        <div className={styles.filterControl}>
          <Calendar size={15} className={styles.filterIcon} />
          <select
            value={selectedDateRange}
            onChange={(e) => onDateRangeChange && onDateRangeChange(e.target.value)}
            className={styles.filterSelect}
            aria-label="Select Date Range"
          >
            {dateRanges.map((range) => (
              <option key={range.id} value={range.id}>
                {range.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.chevronIcon} />
        </div>
      </div>

      {/* Right Section: Actions, Notifications, Theme & Profile */}
      <div className={styles.rightSection}>
        {/* Quick Add Trade */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={onAddTradeClick}
        >
          Add Trade
        </Button>

        {/* Theme Toggle */}
        <button
          className={styles.iconButton}
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle visual theme"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button
          className={styles.iconButton}
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell size={17} />
          <span className={styles.notificationDot} />
        </button>

        {/* User Profile Pill */}
        <div className={styles.profileWrapper}>
          <button
            className={styles.profileButton}
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            aria-label="User profile menu"
          >
            <div className={styles.avatar}>
              <span>AT</span>
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.userName}>Alex Trader</span>
              <span className={styles.userRole}>Pro Member</span>
            </div>
            <ChevronDown size={13} className={styles.chevronIcon} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div
              className={styles.dropdownMenu}
              onMouseLeave={() => setIsProfileMenuOpen(false)}
            >
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownEmail}>alex.trader@example.com</p>
                <span className={styles.tierPill}>Pro Plan (Annual)</span>
              </div>
              <div className={styles.dropdownDivider} />
              <a href="/settings" className={styles.dropdownItem}>
                <Settings size={15} />
                <span>Account Settings</span>
              </a>
              <a href="/billing" className={styles.dropdownItem}>
                <Wallet size={15} />
                <span>Subscription & Billing</span>
              </a>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={() => alert("Logged out successfully.")}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
