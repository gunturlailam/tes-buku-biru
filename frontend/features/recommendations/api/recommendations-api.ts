import { apiClient } from "@/lib/api-client";
import type {
  RecommendationsResponse,
  FinancialQueryParams,
} from "@/types/api";
import type { Recommendation } from "@/types/financial";

export const recommendationsApi = {
  getRecommendations: async (
    params: FinancialQueryParams,
  ): Promise<RecommendationsResponse> => {
    const { data } = await apiClient.get("/recommendations", { 
      params: {
        from: params.from,
        to: params.to,
      }
    });
    
    // Ensure period is added to each recommendation if missing
    const recommendations = (data.recommendations || []).map((rec: Recommendation) => ({
      ...rec,
      period: rec.period || { from: params.from, to: params.to },
    }));
    
    return {
      ...data,
      recommendations,
    };
  },
};
