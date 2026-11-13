import { apiClient } from "@/lib/api-client";
import type {
  RecommendationsResponse,
  FinancialQueryParams,
} from "@/types/api";

export const recommendationsApi = {
  getRecommendations: async (
    params: FinancialQueryParams,
  ): Promise<RecommendationsResponse> => {
    const { data } = await apiClient.get("/recommendations", { params });
    return data;
  },
};
