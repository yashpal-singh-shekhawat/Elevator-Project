import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { InvoiceDto, CreateInvoiceInput } from '@lift-saas/shared-types';

export interface ListInvoicesParams {
  entityType?: string;
  entityId?: number;
  statusId?: number;
  page?: number;
  limit?: number;
}

export async function listInvoices(params?: ListInvoicesParams) {
  const res = await apiClient.get<never>('/invoices', { params });
  return unwrapList<InvoiceDto>(res);
}

export async function getInvoice(id: number) {
  const res = await apiClient.get<never>(`/invoices/${id}`);
  return unwrap<InvoiceDto>(res);
}

export async function createInvoice(input: CreateInvoiceInput) {
  const res = await apiClient.post<never>('/invoices', input);
  return unwrap<InvoiceDto>(res);
}

export async function sendInvoice(id: number) {
  const res = await apiClient.post<never>(`/invoices/${id}/send`, {});
  return unwrap<InvoiceDto>(res);
}

export async function markInvoicePaid(id: number, input?: { paymentId?: number; notes?: string }) {
  const res = await apiClient.post<never>(`/invoices/${id}/mark-paid`, input ?? {});
  return unwrap<InvoiceDto>(res);
}
