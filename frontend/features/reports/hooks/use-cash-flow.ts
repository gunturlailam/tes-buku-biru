import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../api/reports-api";
import type { FinancialQueryParams } from "@/types/api";

export function useCashFlow(params: FinancialQueryParams) {
  return useQuery({
    queryKey: ["cash-flow", params],
    queryFn: () => reportsApi.getCashFlowReport(params),
    enabled: Boolean(params.from && params.to),
  });
}
