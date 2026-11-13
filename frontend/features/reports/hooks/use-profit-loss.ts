import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reports-api";
import type { FinancialQueryParams } from "@/types/api";

export function useProfitLoss(params: FinancialQueryParams) {
  return useQuery({
    queryKey: ["profit-loss", params],
    queryFn: () => reportsApi.getProfitLossReport(params),
    enabled: Boolean(params.from && params.to),
  });
}
