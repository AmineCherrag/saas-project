"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  CalendarDays,
  BookOpen,
  Workflow,
  CheckSquare,
  UploadCloud,
  CreditCard,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
}) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Trading Accounts", href: "/accounts", icon: Wallet },
    { label: "Trades Log", href: "/trades", icon: ReceiptText },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Calendar", href: "/calendar", icon: CalendarDays },
    { label: "Daily Journal", href: "/journal", icon: BookOpen },
    { label: "Playbooks", href: "/playbooks", icon: Workflow },
    { label: "Discipline & Rules", href: "/progress", icon: CheckSquare },
    { label: "Import CSV", href: "/trades/import", icon: UploadCloud },
  ];

  const bottomItems = [
    { label: "Billing & Plan", href: "/billing", icon: CreditCard },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Admin Panel", href: "/admin", icon: ShieldCheck },
  ];

  const handleLinkClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className={styles.mobileBackdrop} onClick={onMobileClose} />
      )}

      <aside
        className={`${styles.sidebar} ${
          isCollapsed ? styles.collapsed : styles.expanded
        } ${isMobileOpen ? styles.mobileOpen : ""}`}
      >
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <Link href="/dashboard" className={styles.brandLogo} onClick={handleLinkClick}>
            <div className={styles.logoIcon}>
              <TrendingUp size={20} className={styles.pulseIcon} />
            </div>
            {!isCollapsed && (
              <div className={styles.brandText}>
                <span className={styles.brandName}>TradePulse</span>
                <span className={styles.brandBadge}>PRO</span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            className={styles.mobileCloseBtn}
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className={styles.navigation}>
          <div className={styles.navGroup}>
            {!isCollapsed && <span className={styles.groupLabel}>Trading Core</span>}
            <ul className={styles.navList}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                      onClick={handleLinkClick}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={19} className={styles.linkIcon} />
                      {!isCollapsed && <span className={styles.linkLabel}>{item.label}</span>}
                      {isActive && <div className={styles.activePill} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.navGroup}>
            {!isCollapsed && <span className={styles.groupLabel}>Account & System</span>}
            <ul className={styles.navList}>
              {bottomItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                      onClick={handleLinkClick}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={19} className={styles.linkIcon} />
                      {!isCollapsed && <span className={styles.linkLabel}>{item.label}</span>}
                      {isActive && <div className={styles.activePill} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Footer Collapse Toggle */}
        <div className={styles.sidebarFooter}>
          <button
            className={styles.collapseToggle}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
