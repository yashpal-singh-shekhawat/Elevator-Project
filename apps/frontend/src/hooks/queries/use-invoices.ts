'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/invoices';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';
import type { CreateInvoiceInput } from '@lift-saas/shared-types';

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: (params?: api.ListInvoicesParams) => [...invoiceKeys.all, 'list', params] as const,
  detail: (id: number) => [...invoiceKeys.all, 'detail', id] as const,
};

export function useInvoices(params?: api.ListInvoicesParams) {
  return useQuery({ queryKey: invoiceKeys.list(params), queryFn: () => api.listInvoices(params) });
}

export function useInvoice(id: number) {
  return useQuery({ queryKey: invoiceKeys.detail(id), queryFn: () => api.getInvoice(id), enabled: Number.isFinite(id) });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => api.createInvoice(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: invoiceKeys.all }); toast({ title: 'Invoice created', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to create invoice', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.sendInvoice(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: invoiceKeys.all }); toast({ title: 'Invoice sent', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to send invoice', description: getErrorMessage(err), variant: 'destructive' }),
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input?: { paymentId?: number; notes?: string } }) => api.markInvoicePaid(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: invoiceKeys.all }); toast({ title: 'Invoice marked paid', variant: 'success' }); },
    onError: (err) => toast({ title: 'Failed to mark paid', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
