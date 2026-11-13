import type {
  FinancialSummary,
  ProfitLossReport,
  CashFlowReport,
  FinancialHealth,
  Forecast,
  Recommendation,
} from "./financial";

/**
 * Query parameters untuk financial endpoints
 */
export interface FinancialQueryParams {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  compare?: "previous_period" | "previous_year";
  currency?: string;
}

/**
 * API Response wrappers
 */
export type FinancialSummaryResponse = FinancialSummary;
export type ProfitLossReportResponse = ProfitLossReport;
export type CashFlowReportResponse = CashFlowReport;
export type FinancialHealthResponse = FinancialHealth;
export type ForecastResponse = Forecast;
export type RecommendationsResponse = {
  recommendations: Recommendation[];
  period: {
    from: string;
    to: string;
  };
  generated_at: string;
};
