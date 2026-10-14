import React from "react";
import styles from "./StatCard.module.css";
import { Badge } from "./Badge";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  variant?: "default" | "profit" | "loss" | "primary";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className = "",
}) => {
  return (
    <div className={`${styles.card} ${styles[variant]} ${className}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
      </div>

      <div className={styles.body}>
        <div className={styles.value}>{value}</div>
      </div>

      {(subtitle || trend) && (
        <div className={styles.footer}>
          {trend && (
            <Badge
              variant={
                trend.isNeutral
                  ? "neutral"
                  : trend.isPositive
                  ? "profit"
                  : "loss"
              }
              size="sm"
            >
              {trend.value}
            </Badge>
          )}
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
