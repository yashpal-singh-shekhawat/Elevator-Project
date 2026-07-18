'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/amc-contracts';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const amcContractKeys = {
  all: ['amc-contracts'] as const,
  list: (params: api.ListAmcContractsParams) => [...amcContractKeys.all, 'list', params] as const,
  detail: (id: number) => [...amcContractKeys.all, 'detail', id] as const
};

export function useAmcContracts(params: api.ListAmcContractsParams) {
  return useQuery({ queryKey: amcContractKeys.list(params), queryFn: () => api.listAmcContracts(params) });
}

export function useAmcContract(id: number) {
  return useQuery({
    queryKey: amcContractKeys.detail(id),
    queryFn: () => api.getAmcContract(id),
    enabled: Number.isFinite(id)
  });
}

export function useCreateAmcContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAmcContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: amcContractKeys.all });
      toast({ title: 'Contract created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to create contract', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateAmcContract(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.UpdateAmcContractInput) => api.updateAmcContract(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: amcContractKeys.all });
      toast({ title: 'Contract updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to update contract', description: getErrorMessage(err), variant: 'destructive' })
  });
}
