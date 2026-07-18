'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/leads';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const leadKeys = {
  all: ['leads'] as const,
  list: (params: api.ListLeadsParams) => [...leadKeys.all, 'list', params] as const,
  detail: (id: number) => [...leadKeys.all, 'detail', id] as const
};

export function useLeads(params: api.ListLeadsParams) {
  return useQuery({ queryKey: leadKeys.list(params), queryFn: () => api.listLeads(params) });
}

export function useLead(id: number) {
  return useQuery({ queryKey: leadKeys.detail(id), queryFn: () => api.getLead(id), enabled: Number.isFinite(id) });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast({ title: 'Lead created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to create lead', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateLead(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<api.CreateLeadInput>) => api.updateLead(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast({ title: 'Lead updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to update lead', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useAssignLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: number; assignedToId: number }) => api.assignLead(id, assignedToId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast({ title: 'Lead assigned', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to assign lead', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useTransitionLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statusId, remarks }: { id: number; statusId: number; remarks?: string }) =>
      api.transitionLead(id, statusId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      queryClient.invalidateQueries({ queryKey: ['workflow-transitions'] });
      toast({ title: 'Lead status updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to update status', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast({ title: 'Lead deleted', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to delete lead', description: getErrorMessage(err), variant: 'destructive' })
  });
}
