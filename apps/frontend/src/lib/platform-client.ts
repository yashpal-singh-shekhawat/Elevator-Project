import axios from 'axios';
import type { ApiResponse, PlatformLoginResponse } from '@lift-saas/shared-types';

// Dedicated axios instance for the platform (super-admin) API. Completely
// separate from the tenant apiClient: its own in-memory access token, its own
// httpOnly refresh cookie (path-scoped to /platform-admin/auth server-side),
// and it NEVER sends the x-tenant-code header. A tenant token can never satisfy
// the platform guard and vice-versa.
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

let platformAccessToken: string | null = null;

export function setPlatformAccessToken(token: string | null): void {
  platformAccessToken = token;
}

export const platformClient = axios.create({
  baseURL: `${baseURL}/platform-admin`,
  withCredentials: true
});

platformClient.interceptors.request.use((config) => {
  if (platformAccessToken) {
    config.headers.Authorization = `Bearer ${platformAccessToken}`;
  }
  return config;
});

export async function platformRefresh(): Promise<PlatformLoginResponse | null> {
  try {
    const res = await platformClient.post<ApiResponse<PlatformLoginResponse>>('/auth/refresh');
    if (res.data.success) {
      setPlatformAccessToken(res.data.data.accessToken);
      return res.data.data;
    }
  } catch {
    setPlatformAccessToken(null);
  }
  return null;
}
