'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import type { ApiResponse, LoginResponse, SafeUser } from '@lift-saas/shared-types';
import { apiClient, setAccessToken } from '@/lib/api-client';
import { currentTenantCode } from '@/lib/tenant';

interface AuthContextValue {
  user: SafeUser | null;
  isLoading: boolean;
  login: (email: string, password: string, companyCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On a hard page load there's no access token in memory yet — the httpOnly
  // refresh cookie (if present and valid) is the only thing that can silently
  // re-establish the session, so we always attempt one refresh on mount.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh');
        if (!cancelled && res.data.success) {
          setAccessToken(res.data.data.accessToken);
          setUser(res.data.data.user);
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, companyCode?: string) => {
    // Resolve the tenant from the explicit arg or the current URL. The backend
    // searches ONLY this tenant's users, so the same email can exist in others.
    const code = companyCode ?? currentTenantCode();
    const url = code ? `/auth/${encodeURIComponent(code)}/login` : '/auth/login';
    const res = await apiClient.post<ApiResponse<LoginResponse>>(url, { email, password });
    if (res.data.success) {
      setAccessToken(res.data.data.accessToken);
      setUser(res.data.data.user);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiClient.post('/auth/logout').catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}
