'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/master-data-admin';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const masterDataKeys = {
  statuses: (params?: api.ListStatusesParams) => ['md-statuses', params] as const,
  liftTypes: (params?: { page?: number; limit?: number }) => ['md-lift-types', params] as const,
  serviceTypes: (params?: { page?: number; limit?: number }) => ['md-service-types', params] as const,
};

// Invalidate both the admin management lists AND the read-only lookup caches
// (['statuses'], ['lift-types'], ['service-types']) so dropdowns elsewhere pick
// up new entries immediately.
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['md-statuses'] });
  qc.invalidateQueries({ queryKey: ['md-lift-types'] });
  qc.invalidateQueries({ queryKey: ['md-service-types'] });
  qc.invalidateQueries({ queryKey: ['statuses'] });
  qc.invalidateQueries({ queryKey: ['lift-types'] });
  qc.invalidateQueries({ queryKey: ['service-types'] });
}

// --- Statuses ---
export function useStatusesAdmin(params?: api.ListStatusesParams) {
  return useQuery({ queryKey: masterDataKeys.statuses(params), queryFn: () => api.listStatusesAdmin(params) });
}

export function useCreateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.CreateStatusInput) => api.createStatus(input),
    onSuccess: () => { invalidateAll(qc); toast({ title: 'Status created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create status', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: api.UpdateStatusInput }) => api.updateStatus(id, input),
    onSuccess: () => { invalidateAll(qc); toast({ title: 'Status updated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to update status', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

// --- Lift types ---
export function useLiftTypesAdmin(params?: { page?: number; limit?: number }) {
  return useQuery({ queryKey: masterDataKeys.liftTypes(params), queryFn: () => api.listLiftTypesAdmin(params) });
}

export function useCreateLiftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.CreateTypeInput) => api.createLiftType(input),
    onSuccess: () => { invalidateAll(qc); toast({ title: 'Lift type created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create lift type', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useUpdateLiftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: api.UpdateTypeInput }) => api.updateLiftType(id, input),
    onSuccess: () => { invalidateAll(qc); toast({ title: 'Lift type updated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to update lift type', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

// --- Service types ---
export function useServiceTypesAdmin(params?: { page?: number; limit?: number }) {
  return useQuery({ queryKey: masterDataKeys.serviceTypes(params), queryFn: () => api.listServiceTypesAdmin(params) });
}

export function useCreateServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.CreateTypeInput) => api.createServiceType(input),
    onSuccess: () => { invalidateAll(qc); toast({ title: 'Service type created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create service type', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useUpdateServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: api.UpdateTypeInput }) => api.updateServiceType(id, input),
    onSuccess: () => { invalidateAll(qc); toast({ title: 'Service type updated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to update service type', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
