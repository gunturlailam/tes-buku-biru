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

// Organization API
export interface OrganizationPayload {
  name: string;
  industry?: string | null;
  currency?: string;
  timezone?: string;
  accounting_basis?: string;
}

export interface OrganizationResponse {
  id: number;
  name: string;
  industry: string | null;
  currency: string;
  timezone: string;
  accounting_basis: string;
}

export const organizationAPI = {
  getOrganization: async (id: number): Promise<OrganizationResponse> => {
    const { data } = await apiClient.get(`/organizations/${id}`);
    return data;
  },

  updateOrganization: async (
    id: number,
    payload: Partial<OrganizationPayload>,
  ): Promise<OrganizationResponse> => {
    const { data } = await apiClient.patch(`/organizations/${id}`, payload);
    return data;
  },
};

// Transaction API
// Kontrak ini HARUS sama dengan backend/app/schemas.py:TransactionIn.
export interface TransactionPayload {
  transaction_date: string; // YYYY-MM-DD
  description: string;
  amount: string;
  tx_type: string;
  category_id?: number | null;
  account_id?: number | null;
}

export const transactionAPI = {
  getTransactions: async (params?: {
    skip?: number;
    limit?: number;
    tx_type?: string;
    category_id?: number;
    search?: string;
    from_date?: string;
    to_date?: string;
  }) => {
    // Parse dates to ensure they're in correct YYYY-MM-DD format
    const from_date = params?.from_date ? String(params.from_date).split("T")[0] : undefined;
    const to_date = params?.to_date ? String(params.to_date).split("T")[0] : undefined;

    // Ensure date parameters are provided with correct names (from/to for backend query params)
    const queryParams = {
      limit: params?.limit || 50,
      offset: params?.skip || 0,
      from: from_date,  // Must be YYYY-MM-DD format
      to: to_date,      // Must be YYYY-MM-DD format
      ...(params?.tx_type && { tx_type: params.tx_type }),
      ...(params?.category_id && { category_id: params.category_id }),
      ...(params?.search && { search: params.search }),
    };

    if (!from_date || !to_date) {
      throw new Error("Date parameters are required (from_date and to_date)");
    }

    const { data } = await apiClient.get("/transactions", { params: queryParams });
    return data.items || [];
  },

  getTransaction: async (id: number) => {
    const { data } = await apiClient.get(`/transactions/${id}`);
    return data;
  },

  createTransaction: async (transactionData: TransactionPayload) => {
    const { data } = await apiClient.post("/transactions", transactionData);
    return data;
  },

  updateTransaction: async (
    id: number,
    transactionData: Partial<TransactionPayload>,
  ) => {
    // Backend hanya menyediakan PATCH, bukan PUT.
    const { data } = await apiClient.patch(`/transactions/${id}`, transactionData);
    return data;
  },

  // Transaksi finansial tidak dihapus permanen. Koreksi dilakukan dengan reversal
  // agar audit trail tetap utuh.
  reverseTransaction: async (id: number) => {
    const { data } = await apiClient.post(`/transactions/${id}/reverse`);
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

  updateRecommendation: async (
    id: string,
    status: "active" | "reviewed" | "dismissed",
  ) => {
    const { data } = await apiClient.patch(`/recommendations/${id}`, {
      status,
    });
    return data;
  },
};

// Export error handler
export { getErrorMessage };
