import { apiClient } from "@/lib/api-client";
import type {
  FinancialQueryParams,
  FinancialSummaryResponse,
  ProfitLossReportResponse,
  CashFlowReportResponse,
} from "@/types/api";

export const reportsApi = {
  getFinancialSummary: async (
    params: FinancialQueryParams,
  ): Promise<FinancialSummaryResponse> => {
    // Ensure dates are in correct YYYY-MM-DD format
    const from_date = String(params.from).split("T")[0];
    const to_date = String(params.to).split("T")[0];

    const { data } = await apiClient.get("/financial/summary", { 
      params: { from: from_date, to: to_date }
    });
    return data;
  },

  /**
   * Get Profit & Loss Report
   */
  getProfitLossReport: async (
    params: FinancialQueryParams,
  ): Promise<ProfitLossReportResponse> => {
    // Ensure dates are in correct YYYY-MM-DD format
    const from_date = String(params.from).split("T")[0];
    const to_date = String(params.to).split("T")[0];

    const { data } = await apiClient.get("/financial/profit-loss", { 
      params: { from: from_date, to: to_date }
    });
    return data;
  },

  /**
   * Get Cash Flow Report
   */
  getCashFlowReport: async (
    params: FinancialQueryParams,
  ): Promise<CashFlowReportResponse> => {
    // Ensure dates are in correct YYYY-MM-DD format
    const from_date = String(params.from).split("T")[0];
    const to_date = String(params.to).split("T")[0];

    const { data } = await apiClient.get("/financial/cash-flow", { 
      params: { from: from_date, to: to_date }
    });
    return data;
  },
};
