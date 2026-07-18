'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/gad-designs';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export function useGadDesigns(params: api.ListGadDesignsParams) {
  return useQuery({ queryKey: ['gad-designs', 'list', params], queryFn: () => api.listGadDesigns(params) });
}

export function useCreateGadDesign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createGadDesign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gad-designs'] });
      toast({ title: 'Design version created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to create design', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useSubmitGadDesign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.submitGadDesign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gad-designs'] });
      toast({ title: 'Submitted for review', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to submit', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useApproveGadDesign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.approveGadDesign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gad-designs'] });
      toast({ title: 'Design approved', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to approve', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useRequestGadDesignChanges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, revisionNotes }: { id: number; revisionNotes: string }) => api.requestGadDesignChanges(id, revisionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gad-designs'] });
      toast({ title: 'Changes requested', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to request changes', description: getErrorMessage(err), variant: 'destructive' })
  });
}
