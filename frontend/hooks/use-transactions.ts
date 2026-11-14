import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { transactionAPI } from "@/lib/api";
import { getDateRangeForPeriod } from "@/lib/date-utils";

interface TransactionFilters {
  skip?: number;
  limit?: number;
  tx_type?: string;
  category_id?: number;
  from_date?: string;
  to_date?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  // ALWAYS ensure we have valid dates - required by backend
  const { from, to } = useMemo(() => {
    // If explicit dates provided, use them
    if (filters?.from_date && filters?.to_date) {
      return {
        from: String(filters.from_date).split("T")[0],
        to: String(filters.to_date).split("T")[0],
      };
    }

    // Otherwise generate MTD dates
    const dateRange = getDateRangeForPeriod("MTD");
    return {
      from: dateRange.from,
      to: dateRange.to,
    };
  }, [filters?.from_date, filters?.to_date]);

  // Build the final params object with required dates
  const finalParams = useMemo(() => {
    return {
      from_date: from,
      to_date: to,
      limit: filters?.limit,
      skip: filters?.skip,
      tx_type: filters?.tx_type,
      category_id: filters?.category_id,
    };
  }, [from, to, filters?.limit, filters?.skip, filters?.tx_type, filters?.category_id]);

  if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
    console.log("[useTransactions] Final params with dates:", finalParams);
  }

  return useQuery({
    queryKey: ["transactions", finalParams],
    queryFn: () => transactionAPI.getTransactions(finalParams),
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
    retryDelay: 1000,
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: () => transactionAPI.getTransaction(id),
    enabled: Boolean(id),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionAPI.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["financial-health"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      transactionAPI.updateTransaction(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["financial-health"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionAPI.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["financial-health"] });
    },
  });
}
