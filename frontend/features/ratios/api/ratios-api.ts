import { apiClient } from "@/lib/api-client";
import type {
  BalanceSheetResponse,
  RatioExplainResponse,
  RatiosResponse,
} from "@/types/ratios";

export interface RatioQueryParams {
  from: string;
  to: string;
  as_of?: string;
}

const cleanParams = (params: RatioQueryParams) => ({
  from: String(params.from).split("T")[0],
  to: String(params.to).split("T")[0],
  ...(params.as_of ? { as_of: String(params.as_of).split("T")[0] } : {}),
});

export const ratiosApi = {
  getRatios: async (params: RatioQueryParams): Promise<RatiosResponse> => {
    const { data } = await apiClient.get("/ratios", {
      params: cleanParams(params),
    });
    return data;
  },

  getBalanceSheet: async (asOf?: string): Promise<BalanceSheetResponse> => {
    const { data } = await apiClient.get("/balance-sheet", {
      params: asOf ? { as_of: String(asOf).split("T")[0] } : undefined,
    });
    return data;
  },

  explainRatio: async (
    code: string,
    params: RatioQueryParams,
  ): Promise<RatioExplainResponse> => {
    const { data } = await apiClient.post(
      `/ratios/${encodeURIComponent(code)}/explain`,
      null,
      { params: cleanParams(params) },
    );
    return data;
  },
};
