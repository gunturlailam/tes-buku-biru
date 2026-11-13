import { useQuery } from "@tanstack/react-query";
import { insightsApi } from "../api/insights-api";
import type { FinancialQueryParams } from "@/types/api";

export function useFinancialHealth(params: FinancialQueryParams) {
  return useQuery({
    queryKey: ["financial-health", params],
    queryFn: () => insightsApi.getFinancialHealth(params),
    enabled: Boolean(params.from && params.to),
  });
}
