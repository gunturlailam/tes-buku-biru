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
    const { data } = await apiClient.get("/financial/summary", { params });
    return data;
  },

  /**
   * Get Profit & Loss Report
   */
  getProfitLossReport: async (
    params: FinancialQueryParams,
  ): Promise<ProfitLossReportResponse> => {
    const { data } = await apiClient.get("/financial/profit-loss", { params });
    return data;
  },

  /**
   * Get Cash Flow Report
   */
  getCashFlowReport: async (
    params: FinancialQueryParams,
  ): Promise<CashFlowReportResponse> => {
    const { data } = await apiClient.get("/financial/cash-flow", { params });
    return data;
  },
};
