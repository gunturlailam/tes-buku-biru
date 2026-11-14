import axios, { AxiosError, AxiosInstance } from "axios";
import { clearAccessToken, getAccessToken } from "@/lib/auth";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Changed to false for network backend
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
      const params = new URLSearchParams(config.params).toString();
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}?${params}`, {
        hasToken: !!config.headers.Authorization,
      });
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.error?.message || error.message,
        url: error.config?.url,
        method: error.config?.method,
      };
      
      // Only log if there's actual error data
      if (error.response?.status && error.response?.status >= 400) {
        console.warn("[API Error Response]", errorDetails);
      }
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearAccessToken();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      reason: string;
    }>;
  };
  request_id?: string;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as
      | (ApiErrorResponse & { detail?: string })
      | undefined;
    return apiError?.error?.message || apiError?.detail || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak diketahui";
}
