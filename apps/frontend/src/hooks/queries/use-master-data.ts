'use client';

import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api/master-data';

export function useCustomers(search?: string) {
  return useQuery({ queryKey: ['customers', search], queryFn: () => api.listCustomers(search) });
}

export function useSites(customerId?: number) {
  return useQuery({
    queryKey: ['sites', customerId],
    queryFn: () => api.listSites(customerId),
    enabled: customerId !== undefined
  });
}

export function useLifts(siteId?: number) {
  return useQuery({
    queryKey: ['lifts', siteId],
    queryFn: () => api.listLifts(siteId),
    enabled: siteId !== undefined
  });
}

export function useLiftTypes() {
  return useQuery({ queryKey: ['lift-types'], queryFn: () => api.listLiftTypes() });
}

export function useServiceTypes() {
  return useQuery({ queryKey: ['service-types'], queryFn: () => api.listServiceTypes() });
}

export function useStatuses(entityType: string) {
  return useQuery({ queryKey: ['statuses', entityType], queryFn: () => api.listStatuses(entityType) });
}

export function useUsers(roleId?: number) {
  return useQuery({ queryKey: ['users', roleId], queryFn: () => api.listUsers(roleId) });
}
