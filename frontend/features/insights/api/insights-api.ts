import { apiClient } from "@/lib/api-client";
import type {
  FinancialHealthResponse,
  FinancialQueryParams,
} from "@/types/api";

export const insightsApi = {
  getFinancialHealth: async (
    params: FinancialQueryParams,
  ): Promise<FinancialHealthResponse> => {
    const { data } = await apiClient.get("/financial/health", { params });
    return data;
  },
};
