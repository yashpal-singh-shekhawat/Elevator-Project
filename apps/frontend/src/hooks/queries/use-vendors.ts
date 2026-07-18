'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/vendors';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';
import type { CreateVendorInput, CreateVendorPOInput, GrnInput } from '@lift-saas/shared-types';

export const vendorKeys = {
  all: ['vendors'] as const,
  list: (params?: api.ListVendorsParams) => [...vendorKeys.all, 'list', params] as const,
  detail: (id: number) => [...vendorKeys.all, 'detail', id] as const,
};

export const vendorPOKeys = {
  all: ['vendor-pos'] as const,
  list: (params?: api.ListVendorPOsParams) => [...vendorPOKeys.all, 'list', params] as const,
  detail: (id: number) => [...vendorPOKeys.all, 'detail', id] as const,
};

export function useVendors(params?: api.ListVendorsParams) {
  return useQuery({ queryKey: vendorKeys.list(params), queryFn: () => api.listVendors(params) });
}

export function useVendor(id: number) {
  return useQuery({ queryKey: vendorKeys.detail(id), queryFn: () => api.getVendor(id), enabled: Number.isFinite(id) });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVendorInput) => api.createVendor(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: vendorKeys.all }); toast({ title: 'Vendor created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create vendor', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useUpdateVendor(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateVendorInput>) => api.updateVendor(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: vendorKeys.all }); toast({ title: 'Vendor updated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to update', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useDeactivateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deactivateVendor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: vendorKeys.all }); toast({ title: 'Vendor deactivated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to deactivate', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useVendorPOs(params?: api.ListVendorPOsParams) {
  return useQuery({ queryKey: vendorPOKeys.list(params), queryFn: () => api.listVendorPOs(params) });
}

export function useVendorPO(id: number) {
  return useQuery({ queryKey: vendorPOKeys.detail(id), queryFn: () => api.getVendorPO(id), enabled: Number.isFinite(id) });
}

export function useCreateVendorPO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVendorPOInput) => api.createVendorPO(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: vendorPOKeys.all }); toast({ title: 'Purchase order created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create PO', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useSendVendorPO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.sendVendorPO(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: vendorPOKeys.all }); toast({ title: 'PO sent to vendor', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to send PO', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useReceiveGRN() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: GrnInput }) => api.receiveGRN(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vendorPOKeys.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'GRN received — inventory updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to receive GRN', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
