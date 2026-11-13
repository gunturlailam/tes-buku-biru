import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: string | number | null,
  currency: string = "IDR",
): string {
  if (value === null || value === undefined) return "-";

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return "-";

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDate(
  date: string | Date,
  format: "short" | "long" = "short",
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "long") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}
