import type { RatioBand, RatioUnit } from "@/types/ratios";

export const RATIO_CATEGORY_ORDER = [
  "liquidity",
  "solvency",
  "activity",
  "profitability",
  "growth",
] as const;

export const RATIO_CATEGORY_LABEL: Record<string, string> = {
  liquidity: "Likuiditas",
  solvency: "Solvabilitas",
  activity: "Aktivitas",
  profitability: "Profitabilitas",
  growth: "Pertumbuhan",
};

export const RATIO_CATEGORY_DESCRIPTION: Record<string, string> = {
  liquidity: "Kemampuan menutup kewajiban jangka pendek.",
  solvency: "Struktur utang dan kemampuan membayar bunga.",
  activity: "Efisiensi persediaan, piutang, utang, dan aset.",
  profitability: "Kualitas margin dan laba terhadap aset/ekuitas.",
  growth: "Arah pertumbuhan pendapatan dibanding periode sebelumnya.",
};

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

export function bandConfig(band: RatioBand): {
  label: string;
  variant: BadgeVariant;
} {
  switch (band) {
    case "above_target":
      return { label: "Memenuhi target", variant: "success" };
    case "between_target_warning":
      return { label: "Perlu dipantau", variant: "warning" };
    case "between_warning_critical":
      return { label: "Di bawah warning", variant: "error" };
    case "below_critical":
      return { label: "Kritis", variant: "error" };
    case "not_configured":
      return { label: "Ambang belum diatur", variant: "default" };
    default:
      return { label: "Data belum cukup", variant: "default" };
  }
}

export function formatRatioValue(
  value: string | null,
  unit: RatioUnit,
): string {
  if (value === null) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  if (unit === "percent") return `${(num * 100).toFixed(2)}%`;
  if (unit === "days") return `${num.toFixed(2)} hari`;
  return `${num.toFixed(2)}x`;
}

export function formatThreshold(value: string, unit: RatioUnit): string {
  return formatRatioValue(value, unit);
}
