import axios, { AxiosError, AxiosInstance } from "axios";

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
    if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
      console.error("[API Error]", error.response?.data || error.message);
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
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
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    return apiError?.error?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak diketahui";
}
