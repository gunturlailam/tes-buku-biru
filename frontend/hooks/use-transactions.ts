import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  // If no date range provided, use default MTD (Month-To-Date)
  const dateRange = filters?.from_date && filters?.to_date 
    ? { from_date: filters.from_date, to_date: filters.to_date }
    : getDateRangeForPeriod("MTD");

  const mergedFilters = {
    ...filters,
    ...dateRange,
  };

  return useQuery({
    queryKey: ["transactions", mergedFilters],
    queryFn: () => transactionAPI.getTransactions(mergedFilters),
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
