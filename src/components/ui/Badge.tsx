import React from "react";
import styles from "./Badge.module.css";

export type BadgeVariant =
  | "profit"
  | "loss"
  | "warning"
  | "info"
  | "neutral"
  | "primary"
  | "cyan"
  | "success"
  | "danger";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
  icon,
  title,
}) => {
  const resolvedClass =
    variant === "success"
      ? styles.profit
      : variant === "danger"
      ? styles.loss
      : styles[variant] || styles.neutral;

  return (
    <span
      title={title}
      className={`${styles.badge} ${resolvedClass} ${styles[size]} ${className}`}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
