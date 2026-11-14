import type { DataQuality, Period } from "./financial";

export type RatioCategory =
  | "liquidity"
  | "solvency"
  | "activity"
  | "profitability"
  | "growth";

export type RatioBand =
  | "above_target"
  | "between_target_warning"
  | "between_warning_critical"
  | "below_critical"
  | "not_configured"
  | "insufficient";

export type RatioStatus = "available" | "unavailable";
export type RatioQuality = "ok" | "partial" | "insufficient";
export type RatioUnit = "x" | "days" | "percent";
export type ThresholdDirection = "higher" | "lower";

export interface RatioThreshold {
  target: string;
  warning: string;
  critical: string;
  direction: ThresholdDirection;
}

export interface RatioNarrative {
  explanation: string;
  action: string;
  source: "fallback" | "llm";
  llm_enabled: boolean;
  quality: RatioQuality;
  disclaimer: string;
  privacy_note?: string;
}

export interface RatioItem {
  code: string;
  name: string;
  category: RatioCategory;
  value: string | null;
  display: string | null;
  status: RatioStatus;
  quality: RatioQuality;
  reason?: string;
  inputs: Record<string, string | null>;
  threshold: RatioThreshold | null;
  band: RatioBand;
  interpretation: string;
  unit: RatioUnit;
  narrative: RatioNarrative;
}

export interface RatioSource {
  snapshot_id: number | null;
  as_of: string;
  previous_snapshot_id: number | null;
  previous_as_of: string | null;
  snapshot_status: string;
  transaction_count: number;
  warnings: string[];
}

export interface RatiosResponse {
  period: Period;
  as_of: string;
  currency: string;
  formula_version: string;
  snapshot_id?: number;
  data_quality: DataQuality;
  ratios: RatioItem[];
  source: RatioSource;
}

export interface BalanceSheetLine {
  account_id: number;
  code: string;
  name: string;
  role: string;
  is_current: boolean;
  amount: string;
}

export interface BalanceSheetResponse {
  as_of: string;
  status: string;
  reason?: string;
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
  totals: {
    total_assets: string | null;
    total_liabilities: string | null;
    total_equity: string | null;
    current_assets: string | null;
    current_liabilities: string | null;
  };
  data_quality: DataQuality;
}

export interface RatioExplainResponse {
  ratio_code: string;
  ratio_name: string;
  period: Period;
  as_of: string;
  band: RatioBand;
  quality: RatioQuality;
  status: RatioStatus;
  value: string | null;
  display: string | null;
  explanation: string;
  action: string;
  source: "fallback" | "llm";
  llm_enabled: boolean;
  privacy_note?: string;
  disclaimer: string;
}
