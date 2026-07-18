'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/dispatches';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export function useDispatches(params: api.ListDispatchesParams) {
  return useQuery({ queryKey: ['dispatches', 'list', params], queryFn: () => api.listDispatches(params) });
}

export function useCreateDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDispatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      toast({ title: 'Dispatch created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to create dispatch', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useValidateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hasException, exceptionNotes }: { id: number; hasException: boolean; exceptionNotes?: string }) =>
      api.validateDelivery(id, hasException, exceptionNotes),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      toast({
        title: vars.hasException ? 'Delivery exception recorded' : 'Delivery validated',
        variant: vars.hasException ? 'destructive' : 'success'
      });
    },
    onError: (err) => toast({ title: 'Failed to validate delivery', description: getErrorMessage(err), variant: 'destructive' })
  });
}
