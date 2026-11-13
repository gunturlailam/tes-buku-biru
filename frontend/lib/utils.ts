import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: string | number | null,
  currency: string = "IDR",
): string {
  if (amount === null) return "-";

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

export function formatPercentage(
  value: string | number | null,
  decimals: number = 1,
): string {
  if (value === null) return "-";

  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "-";

  return `${numValue.toFixed(decimals)}%`;
}

export function formatDate(
  date: string | Date,
  format: "short" | "long" = "short",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "long") {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
