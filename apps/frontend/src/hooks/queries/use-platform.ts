'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/platform';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';
import type { CreateTenantInput, UpdateTenantInput } from '@lift-saas/shared-types';

export const platformKeys = {
  all: ['platform'] as const,
  dashboard: () => [...platformKeys.all, 'dashboard'] as const,
  tenants: () => [...platformKeys.all, 'tenants'] as const,
  tenantList: (params?: api.ListTenantsParams) => [...platformKeys.tenants(), 'list', params] as const,
  tenantDetail: (id: number) => [...platformKeys.tenants(), 'detail', id] as const
};

export function useDashboardStats() {
  return useQuery({ queryKey: platformKeys.dashboard(), queryFn: () => api.getDashboardStats() });
}

export function useTenants(params?: api.ListTenantsParams) {
  return useQuery({ queryKey: platformKeys.tenantList(params), queryFn: () => api.listTenants(params) });
}

export function useTenant(id: number) {
  return useQuery({
    queryKey: platformKeys.tenantDetail(id),
    queryFn: () => api.getTenant(id),
    enabled: Number.isFinite(id) && id > 0
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: platformKeys.all });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantInput) => api.createTenant(input),
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: 'Tenant created', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to create tenant', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateTenant(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantInput) => api.updateTenant(id, input),
    onSuccess: () => {
      invalidateAll(qc);
      toast({ title: 'Tenant updated', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to update tenant', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useSetTenantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => api.setTenantStatus(id, isActive),
    onSuccess: (tenant) => {
      invalidateAll(qc);
      toast({
        title: tenant.status === 'ACTIVE' ? 'Tenant activated' : 'Tenant deactivated',
        variant: 'success'
      });
    },
    onError: (err) =>
      toast({ title: 'Failed to update status', description: getErrorMessage(err), variant: 'destructive' })
  });
}
