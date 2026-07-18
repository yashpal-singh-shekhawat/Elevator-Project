import { apiClient } from '@/lib/api-client';
import { unwrap } from './unwrap';

export interface TenantBranding {
  name: string;
  logoUrl: string | null;
}

// Public endpoint — no auth. Returns null for unknown/inactive tenants so the
// caller falls back to the default product branding.
export async function getTenantBranding(companyCode: string) {
  const res = await apiClient.get<never>(`/auth/${encodeURIComponent(companyCode)}/branding`);
  return unwrap<TenantBranding | null>(res);
}
