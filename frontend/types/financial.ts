export type Currency = "IDR";

export type DataQualityStatus =
  | "insufficient"
  | "partial"
  | "usable"
  | "verified";

export type MetricStatus = "available" | "unavailable";

export type RiskLevel = "normal" | "attention" | "critical" | "insufficient";

/**
 * Period definition
 */
export interface Period {
  from: string; // ISO 8601 date (YYYY-MM-DD)
  to: string; // ISO 8601 date (YYYY-MM-DD)
}

/**
 * Data quality metadata
 */
export interface DataQuality {
  status: DataQualityStatus;
  warnings?: string[];
}

/**
 * Metric value dengan status
 */
export interface MetricValue<T = string> {
  value: T | null;
  status: MetricStatus;
  reason?: string; // Alasan jika unavailable
}

/**
 * Financial Summary Response
 */
export interface FinancialSummary {
  period: Period;
  currency: Currency;
  data_quality: DataQuality;
  formula_version: string;
  generated_at: string; // ISO 8601 timestamp
  metrics: {
    net_revenue: MetricValue;
    gross_profit?: MetricValue;
    net_profit: MetricValue;
    cash_in: MetricValue;
    cash_out: MetricValue;
    net_cash_flow: MetricValue;
    gross_margin?: MetricValue<number>; // percentage
    net_margin?: MetricValue<number>; // percentage
  };
}

/**
 * Profit Loss Report
 */
export interface ProfitLossReport {
  period: Period;
  currency: Currency;
  data_quality: DataQuality;
  formula_version: string;
  generated_at: string;
  items: {
    gross_sales: MetricValue;
    sales_returns?: MetricValue;
    sales_discounts?: MetricValue;
    net_revenue: MetricValue;
    cogs?: MetricValue;
    gross_profit?: MetricValue;
    operating_expenses: MetricValue;
    operating_profit?: MetricValue;
    other_income?: MetricValue;
    finance_cost?: MetricValue;
    tax_expense?: MetricValue;
    net_profit: MetricValue;
  };
  ratios: {
    gross_margin?: MetricValue<number>;
    operating_margin?: MetricValue<number>;
    net_margin?: MetricValue<number>;
  };
}

/**
 * Cash Flow Report
 */
export interface CashFlowReport {
  period: Period;
  currency: Currency;
  data_quality: DataQuality;
  generated_at: string;
  note?: string; // e.g., "Cash movement summary based on recorded transactions"
  items: {
    opening_cash?: MetricValue;
    cash_in: MetricValue;
    cash_out: MetricValue;
    net_cash_flow: MetricValue;
    closing_cash?: MetricValue;
  };
  breakdown?: {
    operating_activities?: MetricValue;
    investing_activities?: MetricValue;
    financing_activities?: MetricValue;
  };
}

/**
 * Risk Signal
 */
export interface RiskSignal {
  id: string;
  title: string;
  level: RiskLevel;
  trigger_metric: string;
  current_value: string | number | null;
  threshold?: string | number;
  period: Period;
  explanation: string;
  recommendation?: string;
}

/**
 * Financial Health Response
 */
export interface FinancialHealth {
  period: Period;
  generated_at: string;
  overall_status?: RiskLevel; // Optional: bisa ditambahkan nanti
  signals: RiskSignal[];
}

/**
 * Forecast
 */
export interface Forecast {
  id: string;
  target: "cash_flow" | "revenue" | "profit";
  horizon: number; // periods ahead
  period_unit: "day" | "week" | "month";
  status: "evaluating" | "available" | "failed";
  model_version?: string;
  training_window?: Period;
  baseline_model?: string;
  created_at: string;
  evaluated_at?: string;
  limitations?: string[];
  predictions?: Array<{
    period: string;
    predicted_value: string;
    lower_bound?: string;
    upper_bound?: string;
  }>;
  evaluation?: {
    mae?: number;
    wape?: number;
    smape?: number;
    bias?: number;
    mase?: number;
  };
}

/**
 * Recommendation
 */
export interface Recommendation {
  id: string;
  rule_id: string;
  rule_version: string;
  title: string;
  priority: "low" | "medium" | "high";
  trigger_metrics: Record<string, string | number>;
  period: Period;
  evidence: string[];
  suggested_actions: string[];
  assumptions: string[];
  limitations: string[];
  confidence_label?: string;
  status: "active" | "reviewed" | "dismissed";
  created_at: string;
  llm_explanation?: string; // Optional LLM-generated explanation
}
