import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { ListQueryParams, QuotationDto, QuotationTier } from '@lift-saas/shared-types';

export interface ListQuotationsParams extends ListQueryParams {
  leadId?: number;
  statusId?: number;
}

export async function listQuotations(params: ListQuotationsParams) {
  const res = await apiClient.get<never>('/quotations', { params });
  return unwrapList<QuotationDto>(res);
}

export async function getQuotation(id: number) {
  const res = await apiClient.get<never>(`/quotations/${id}`);
  return unwrap<QuotationDto>(res);
}

export interface CreateQuotationInput {
  leadId: number;
  tier?: QuotationTier;
  statusId: number;
  preparedById?: number;
  validUntil?: string;
  totalAmount?: number;
  notes?: string;
}

export async function createQuotation(input: CreateQuotationInput) {
  const res = await apiClient.post<never>('/quotations', input);
  return unwrap<QuotationDto>(res);
}

export async function updateQuotation(id: number, input: Partial<Omit<CreateQuotationInput, 'leadId'>> & { rejectionReason?: string }) {
  const res = await apiClient.patch<never>(`/quotations/${id}`, input);
  return unwrap<QuotationDto>(res);
}

export async function approveQuotation(id: number, notes?: string) {
  const res = await apiClient.post<never>(`/quotations/${id}/approve`, { notes });
  return unwrap<QuotationDto>(res);
}

export async function rejectQuotation(id: number, rejectionReason: string) {
  const res = await apiClient.post<never>(`/quotations/${id}/reject`, { rejectionReason });
  return unwrap<QuotationDto>(res);
}

export async function reviseQuotation(id: number) {
  const res = await apiClient.post<never>(`/quotations/${id}/revise`, {});
  return unwrap<QuotationDto>(res);
}
