import { apiClient } from "@/lib/api-client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  full_name: string;
  organization_name: string;
  industry?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  organization_id?: number;
}

export interface CurrentUser {
  id: number;
  email: string;
  full_name: string;
  organization_id: number;
  role: string;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },

  async register(payload: RegisterPayload): Promise<void> {
    await apiClient.post("/auth/register", payload);
  },

  async getCurrentUser(): Promise<CurrentUser> {
    const { data } = await apiClient.get<CurrentUser>("/me");
    return data;
  },
};
