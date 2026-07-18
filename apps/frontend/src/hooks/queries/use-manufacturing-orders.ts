'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/manufacturing-orders';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export function useManufacturingOrders(params: api.ListManufacturingOrdersParams) {
  return useQuery({ queryKey: ['manufacturing-orders', 'list', params], queryFn: () => api.listManufacturingOrders(params) });
}

export function useCreateManufacturingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ installationProjectId, notes }: { installationProjectId: number; notes?: string }) =>
      api.createManufacturingOrder(installationProjectId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast({ title: 'Manufacturing order released', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to release order', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useQcPassManufacturingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.qcPassManufacturingOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast({ title: 'QC passed', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to record QC pass', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useQcFailManufacturingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.qcFailManufacturingOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast({ title: 'QC failure recorded', variant: 'destructive' });
    },
    onError: (err) => toast({ title: 'Failed to record QC failure', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useMarkReadyForDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.markReadyForDispatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-orders'] });
      toast({ title: 'Marked ready for dispatch', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to update', description: getErrorMessage(err), variant: 'destructive' })
  });
}
