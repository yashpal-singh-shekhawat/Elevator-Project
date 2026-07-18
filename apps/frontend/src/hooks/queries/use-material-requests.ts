'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/material-requests';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const materialRequestKeys = {
  all: ['material-requests'] as const,
  list: (params?: api.ListMaterialRequestsParams) => [...materialRequestKeys.all, 'list', params] as const,
  detail: (id: number) => [...materialRequestKeys.all, 'detail', id] as const,
};

export function useMaterialRequests(params?: api.ListMaterialRequestsParams) {
  return useQuery({ queryKey: materialRequestKeys.list(params), queryFn: () => api.listMaterialRequests(params) });
}

export function useMaterialRequest(id: number) {
  return useQuery({ queryKey: materialRequestKeys.detail(id), queryFn: () => api.getMaterialRequest(id), enabled: Number.isFinite(id) });
}

export function useCreateMaterialRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createMaterialRequest,
    onSuccess: () => { qc.invalidateQueries({ queryKey: materialRequestKeys.all }); toast({ title: 'Material request created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create request', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useApproveMaterialRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.approveMaterialRequest(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: materialRequestKeys.all }); toast({ title: 'Request approved', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to approve', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useIssueFromStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.issueFromStock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialRequestKeys.all });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Stock issued', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to issue stock', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useRaisePO() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vendorId }: { id: number; vendorId: number }) => api.raisePO(id, vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialRequestKeys.all });
      qc.invalidateQueries({ queryKey: ['vendor-pos'] });
      toast({ title: 'PO raised', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to raise PO', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useRejectMaterialRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.rejectMaterialRequest(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: materialRequestKeys.all }); toast({ title: 'Request rejected', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to reject', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
