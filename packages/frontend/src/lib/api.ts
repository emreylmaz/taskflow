/**
 * API Client — Merkezi HTTP client
 * - Request/response interceptors
 * - 401 auto refresh
 * - Type-safe API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

// In-memory token (XSS'e karşı localStorage'dan güvenli)
let accessToken: string | null = null;

// 401 listener'ları
type UnauthorizedCallback = () => void;
const unauthorizedCallbacks: Set<UnauthorizedCallback> = new Set();

export function setAuthToken(token: string) {
  accessToken = token;
}

export function clearAuthToken() {
  accessToken = null;
}

export function getAuthToken(): string | null {
  return accessToken;
}

export function onUnauthorized(callback: UnauthorizedCallback): () => void {
  unauthorizedCallbacks.add(callback);
  return () => unauthorizedCallbacks.delete(callback);
}

function notifyUnauthorized() {
  unauthorizedCallbacks.forEach((cb) => cb());
}

interface ApiError extends Error {
  status: number;
  data?: unknown;
}

function createApiError(
  message: string,
  status: number,
  data?: unknown,
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.data = data;
  return error;
}

// Refresh token ile yeni access token al
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  // Concurrent refresh'leri engelle
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.accessToken) {
        setAuthToken(data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
  retry?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, retry = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Authorization header ekle
  if (!skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: "include",
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, config);

  // 401 ise token'ı refresh etmeyi dene
  if (response.status === 401 && retry && !skipAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Token yenilendi, isteği tekrar dene
      return request<T>(endpoint, { ...options, retry: false });
    }
    // Refresh başarısız, logout yap
    notifyUnauthorized();
    throw createApiError("Oturum süresi doldu", 401);
  }

  // Response'u parse et
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data as { message?: string })?.message || "Bir hata oluştu";
    throw createApiError(message, response.status, data);
  }

  return data as T;
}

// API methods
export const api = {
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: "POST", body });
  },

  put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: "PUT", body });
  },

  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return request<T>(endpoint, { ...options, method: "PATCH", body });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },
};
