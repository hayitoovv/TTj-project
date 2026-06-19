import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const TOKEN_KEY = "ttj_access_token";
export const REFRESH_KEY = "ttj_refresh_token";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Inject access token on every request (browser only)
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.set?.("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});

// Auto-refresh on 401 once
let isRefreshing = false;
let pendingRequests: ((token: string) => void)[] = [];

apiClient.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (
      typeof window === "undefined" ||
      !original ||
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((newToken: string) => {
          original.headers.set?.("Authorization", `Bearer ${newToken}`);
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh });
      saveTokens(data.access_token, data.refresh_token);
      pendingRequests.forEach((cb) => cb(data.access_token));
      pendingRequests = [];
      original.headers.set?.("Authorization", `Bearer ${data.access_token}`);
      return apiClient(original);
    } catch (refreshErr) {
      clearTokens();
      pendingRequests = [];
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export function saveTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: { message?: string } | string; error?: { message?: string } }
      | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (data?.detail && typeof data.detail === "object" && data.detail.message)
      return data.detail.message;
    if (data?.error?.message) return data.error.message;
    if (error.message) return error.message;
  }
  return "Kutilmagan xatolik yuz berdi";
}
