/**
 * Central API module - exports all API clients
 */

import { apiClient, getErrorMessage } from "./api-client";
import { insightsApi } from "@/features/insights/api/insights-api";
import { recommendationsApi } from "@/features/recommendations/api/recommendations-api";
import { reportsApi } from "@/features/reports/api/reports-api";
import type { FinancialQueryParams } from "@/types/api";

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    return data;
  },

  register: async (userData: {
    email: string;
    password: string;
    full_name: string;
    organization_name: string;
  }) => {
    const { data } = await apiClient.post("/auth/register", userData);
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get("/me");
    return data;
  },
};

// Transaction API
export const transactionAPI = {
  getTransactions: async (params?: {
    skip?: number;
    limit?: number;
    tx_type?: string;
    category_id?: number;
    from_date?: string;
    to_date?: string;
  }) => {
    const { data } = await apiClient.get("/transactions", { params });
    return data;
  },

  getTransaction: async (id: number) => {
    const { data } = await apiClient.get(`/transactions/${id}`);
    return data;
  },

  createTransaction: async (transactionData: {
    tx_type: string;
    amount: string;
    tx_date: string;
    category_id: number;
    description?: string;
    counterparty?: string;
  }) => {
    const { data } = await apiClient.post("/transactions", transactionData);
    return data;
  },

  updateTransaction: async (
    id: number,
    transactionData: {
      tx_type?: string;
      amount?: string;
      tx_date?: string;
      category_id?: number;
      description?: string;
      counterparty?: string;
    }
  ) => {
    const { data } = await apiClient.put(`/transactions/${id}`, transactionData);
    return data;
  },

  deleteTransaction: async (id: number) => {
    const { data } = await apiClient.delete(`/transactions/${id}`);
    return data;
  },

  reverseTransaction: async (id: number, reason: string) => {
    const { data } = await apiClient.post(`/transactions/${id}/reverse`, { reason });
    return data;
  },
};

// Category API
export const categoryAPI = {
  getCategories: async () => {
    const { data } = await apiClient.get("/categories");
    return data;
  },
};

// Financial API (from reports)
export const financialAPI = {
  getSummary: async (params: FinancialQueryParams) => {
    return reportsApi.getFinancialSummary(params);
  },

  getProfitLoss: async (params: FinancialQueryParams) => {
    return reportsApi.getProfitLossReport(params);
  },

  getCashFlow: async (params: FinancialQueryParams) => {
    return reportsApi.getCashFlowReport(params);
  },

  getHealth: async (params: FinancialQueryParams) => {
    return insightsApi.getFinancialHealth(params);
  },
};

// Recommendation API
export const recommendationAPI = {
  getRecommendations: async (params: FinancialQueryParams) => {
    return recommendationsApi.getRecommendations(params);
  },
};

// Export error handler
export { getErrorMessage };
