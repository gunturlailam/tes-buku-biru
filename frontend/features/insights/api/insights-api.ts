import { apiClient } from "@/lib/api-client";
import type {
  FinancialHealthResponse,
  FinancialQueryParams,
} from "@/types/api";

export const insightsApi = {
  getFinancialHealth: async (
    params: FinancialQueryParams,
  ): Promise<FinancialHealthResponse> => {
    // Ensure dates are in correct YYYY-MM-DD format
    const from_date = String(params.from).split("T")[0];
    const to_date = String(params.to).split("T")[0];

    const { data } = await apiClient.get("/financial/health", { 
      params: {
        from: from_date,
        to: to_date,
      }
    });
    return data;
  },
};
