import { useMutation, useQuery } from "@tanstack/react-query";
import { ratiosApi, type RatioQueryParams } from "../api/ratios-api";

export function useRatios(params: RatioQueryParams) {
  return useQuery({
    queryKey: ["ratios", params],
    queryFn: () => ratiosApi.getRatios(params),
    enabled: Boolean(params.from && params.to),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });
}

export function useBalanceSheet(asOf?: string) {
  return useQuery({
    queryKey: ["balance-sheet", asOf],
    queryFn: () => ratiosApi.getBalanceSheet(asOf),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });
}

export function useExplainRatio(params: RatioQueryParams) {
  return useMutation({
    mutationFn: (code: string) => ratiosApi.explainRatio(code, params),
  });
}
