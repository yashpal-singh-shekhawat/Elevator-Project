'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/lifts';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const liftKeys = {
  all: ['lifts'] as const,
  list: (params?: api.ListLiftsParams) => [...liftKeys.all, 'list', params] as const,
  detail: (id: number) => [...liftKeys.all, 'detail', id] as const,
};

export function useLifts(params?: api.ListLiftsParams) {
  return useQuery({ queryKey: liftKeys.list(params), queryFn: () => api.listLifts(params) });
}

export function useLift(id: number) {
  return useQuery({ queryKey: liftKeys.detail(id), queryFn: () => api.getLift(id), enabled: Number.isFinite(id) });
}

export function useCreateLift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: api.CreateLiftInput) => api.createLift(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: liftKeys.all }); toast({ title: 'Lift created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create lift', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useUpdateLift(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Omit<api.CreateLiftInput, 'siteId'>>) => api.updateLift(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: liftKeys.all }); toast({ title: 'Lift updated', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to update lift', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useDeleteLift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteLift(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: liftKeys.all }); toast({ title: 'Lift deleted', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to delete lift', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
