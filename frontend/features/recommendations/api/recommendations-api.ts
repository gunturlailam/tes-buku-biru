import { apiClient } from "@/lib/api-client";
import type {
  RecommendationsResponse,
  FinancialQueryParams,
} from "@/types/api";

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
    const recommendations = (data.recommendations || []).map((rec: any) => ({
      ...rec,
      period: rec.period || { from: params.from, to: params.to },
    }));
    
    return {
      ...data,
      recommendations,
    };
  },
};
