/**
 * Deterministic formatters for currency, numbers, and dates.
 * Enforces the "en-US" locale across both server-side rendering (SSR) and client-side
 * hydration to completely eliminate locale-dependent hydration mismatches.
 */

export function formatNumber(val: number): string {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return val.toLocaleString("en-US");
}

export function formatCurrency(
  val: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (val === null || val === undefined || isNaN(val)) return "$0.00";
  return val.toLocaleString("en-US", {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
}

export function formatDate(dateInput: string | Date | number): string {
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatDateTime(dateInput: string | Date | number): string {
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function formatTime(dateInput: string | Date | number): string {
  try {
    const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}
