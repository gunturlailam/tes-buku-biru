import { useQuery } from "@tanstack/react-query";
import { recommendationsApi } from "../api/recommendations-api";
import type { FinancialQueryParams } from "@/types/api";

export function useRecommendations(params: FinancialQueryParams) {
  return useQuery({
    queryKey: ["recommendations", params],
    queryFn: () => recommendationsApi.getRecommendations(params),
    enabled: Boolean(params.from && params.to),
  });
}
