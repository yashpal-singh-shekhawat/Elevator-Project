'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/quotations';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export function useQuotations(params: api.ListQuotationsParams) {
  return useQuery({ queryKey: ['quotations', 'list', params], queryFn: () => api.listQuotations(params) });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to create quotation', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useApproveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => api.approveQuotation(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation approved', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to approve', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useRejectQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: number; rejectionReason: string }) => api.rejectQuotation(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'Quotation rejected', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to reject', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useReviseQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.reviseQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: 'New revision created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to revise', description: getErrorMessage(err), variant: 'destructive' })
  });
}
