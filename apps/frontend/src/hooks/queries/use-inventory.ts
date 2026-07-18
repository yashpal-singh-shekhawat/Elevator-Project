'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/inventory';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';
import type { CreateInventoryStockInput, AdjustStockInput } from '@lift-saas/shared-types';

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (params?: api.ListInventoryParams) => [...inventoryKeys.all, 'list', params] as const,
  detail: (id: number) => [...inventoryKeys.all, 'detail', id] as const,
};

export function useInventory(params?: api.ListInventoryParams) {
  return useQuery({ queryKey: inventoryKeys.list(params), queryFn: () => api.listInventory(params) });
}

export function useInventoryStock(id: number) {
  return useQuery({ queryKey: inventoryKeys.detail(id), queryFn: () => api.getInventoryStock(id), enabled: Number.isFinite(id) });
}

export function useCreateInventoryStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInventoryStockInput) => api.createInventoryStock(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: inventoryKeys.all }); toast({ title: 'Stock record created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create stock', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useUpdateInventoryStock(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateInventoryStockInput>) => api.updateInventoryStock(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: inventoryKeys.all }); toast({ title: 'Stock updated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to update', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useAdjustStock(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustStockInput) => api.adjustStock(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      toast({ title: `Stock adjusted by ${vars.quantity > 0 ? '+' : ''}${vars.quantity}`, variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to adjust', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
