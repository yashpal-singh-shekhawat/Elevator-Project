import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, LoginResponse } from '@lift-saas/shared-types';
import { currentTenantCode, tenantHref } from './tenant';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

// Held in memory only — never localStorage/sessionStorage (XSS-exposed).
// The refresh token itself lives in an httpOnly cookie the browser sends
// automatically; this module never sees it.
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export const apiClient = axios.create({ baseURL, withCredentials: true });

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  // Attach the tenant code the current URL claims. UNTRUSTED on the server —
  // it only drives the backend's URL-vs-JWT mismatch guard (403), never data
  // scoping. Read live from the address bar so navigation always stays in sync.
  const code = currentTenantCode();
  if (code) {
    config.headers['x-tenant-code'] = code;
  }
  return config;
});

// Deduplicates concurrent 401s into a single refresh call instead of one per
// failed request.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<ApiResponse<LoginResponse>>(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  if (!response.data.success) throw new Error('Refresh failed');
  setAccessToken(response.data.data.accessToken);
  return response.data.data.accessToken;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const isAuthRoute = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          // Send the user back to THEIR tenant login, preserving company context.
          // Super-admin pages fall back to the super-admin login.
          const path = window.location.pathname;
          if (path.startsWith('/super-admin')) {
            window.location.href = '/super-admin/login';
          } else {
            const code = currentTenantCode();
            window.location.href = code ? tenantHref(code, '/login') : '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
