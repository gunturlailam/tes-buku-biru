import { useQuery } from "@tanstack/react-query";
import { financialAPI } from "@/lib/api";
import type { FinancialQueryParams } from "@/types/api";

export function useFinancialSummary(params: FinancialQueryParams) {
  return useQuery({
    queryKey: ["financial-summary", params],
    queryFn: () => financialAPI.getSummary(params),
    enabled: Boolean(params.from && params.to),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
