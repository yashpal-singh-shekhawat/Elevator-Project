'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/amc-visits';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

const visitKeys = {
  list: (params: api.ListAmcVisitsParams) => ['amc-visits', 'list', params] as const
};

export function useAmcVisits(params: api.ListAmcVisitsParams) {
  return useQuery({ queryKey: visitKeys.list(params), queryFn: () => api.listAmcVisits(params) });
}

export function useCreateAmcVisit(amcContractId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<api.CreateAmcVisitInput, 'amcContractId'>) => api.createAmcVisit({ ...input, amcContractId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amc-visits'] });
      queryClient.invalidateQueries({ queryKey: ['amc-schedules'] });
      toast({ title: 'Visit scheduled', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to schedule visit', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateAmcVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: api.UpdateAmcVisitInput }) => api.updateAmcVisit(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amc-visits'] });
      queryClient.invalidateQueries({ queryKey: ['amc-schedules'] });
      toast({ title: 'Visit updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to update visit', description: getErrorMessage(err), variant: 'destructive' })
  });
}
