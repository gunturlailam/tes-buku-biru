import { useQuery } from "@tanstack/react-query";
import { dataIntakeApi } from "../api/data-intake-api";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: dataIntakeApi.listAccounts,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBalanceSnapshots(asOf?: string) {
  return useQuery({
    queryKey: ["balance-snapshots", asOf ?? "all"],
    queryFn: () => dataIntakeApi.listBalanceSnapshots(asOf),
    staleTime: 1000 * 30,
  });
}

export function useAccountingPeriods() {
  return useQuery({
    queryKey: ["accounting-periods"],
    queryFn: dataIntakeApi.listPeriods,
    staleTime: 1000 * 30,
  });
}

export function useReceivables() {
  return useQuery({
    queryKey: ["receivables"],
    queryFn: dataIntakeApi.listReceivables,
    staleTime: 1000 * 30,
  });
}

export function usePayables() {
  return useQuery({
    queryKey: ["payables"],
    queryFn: dataIntakeApi.listPayables,
    staleTime: 1000 * 30,
  });
}

export function useInventoryItems() {
  return useQuery({
    queryKey: ["inventory-items"],
    queryFn: dataIntakeApi.listInventoryItems,
    staleTime: 1000 * 30,
  });
}

export function useFixedAssets() {
  return useQuery({
    queryKey: ["fixed-assets"],
    queryFn: dataIntakeApi.listFixedAssets,
    staleTime: 1000 * 30,
  });
}

export function useLoans() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: dataIntakeApi.listLoans,
    staleTime: 1000 * 30,
  });
}
