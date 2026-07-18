import { platformClient } from '@/lib/platform-client';
import { unwrap, unwrapList } from './unwrap';
import type {
  ApiResponse,
  CreateTenantInput,
  PlatformDashboardStats,
  TenantDto,
  UpdateTenantInput
} from '@lift-saas/shared-types';

// Data layer for the super-admin (platform) API. Mirrors the tenant-side
// src/lib/api/* files but talks to platformClient (…/platform-admin/*), which
// carries the platform JWT and never sends x-tenant-code.
//
// Note the field-name mapping: shared-types uses companyName/companyUniqueCode
// for the UI, while the backend contract uses name/companyCode. We translate
// here so components speak the UI vocabulary everywhere.

export interface ListTenantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export async function getDashboardStats() {
  const res = await platformClient.get<ApiResponse<PlatformDashboardStats>>('/dashboard');
  return unwrap(res);
}

export async function listTenants(params?: ListTenantsParams) {
  const res = await platformClient.get<ApiResponse<TenantDto[]>>('/tenants', { params });
  return unwrapList<TenantDto>(res);
}

export async function getTenant(id: number) {
  const res = await platformClient.get<ApiResponse<TenantDto>>(`/tenants/${id}`);
  return unwrap(res);
}

export async function createTenant(input: CreateTenantInput) {
  const res = await platformClient.post<ApiResponse<TenantDto>>('/tenants', {
    name: input.companyName,
    companyCode: input.companyUniqueCode,
    contactPerson: input.contactPerson,
    email: input.email,
    phone: input.phone,
    address: input.address,
    logoBase64: input.logoBase64
  });
  return unwrap(res);
}

export async function updateTenant(id: number, input: UpdateTenantInput) {
  const res = await platformClient.put<ApiResponse<TenantDto>>(`/tenants/${id}`, {
    name: input.companyName,
    contactPerson: input.contactPerson,
    email: input.email,
    phone: input.phone,
    address: input.address,
    logoBase64: input.logoBase64
  });
  return unwrap(res);
}

export async function setTenantStatus(id: number, isActive: boolean) {
  const res = await platformClient.patch<ApiResponse<TenantDto>>(`/tenants/${id}/status`, { isActive });
  return unwrap(res);
}
