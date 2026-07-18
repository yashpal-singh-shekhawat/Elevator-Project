import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { LeadDto, LeadSource, LeadVertical, ListQueryParams } from '@lift-saas/shared-types';

export interface ListLeadsParams extends ListQueryParams {
  vertical?: LeadVertical;
  statusId?: number;
  assignedToId?: number;
}

export async function listLeads(params: ListLeadsParams) {
  const res = await apiClient.get<never>('/leads', { params });
  return unwrapList<LeadDto>(res);
}

export async function getLead(id: number) {
  const res = await apiClient.get<never>(`/leads/${id}`);
  return unwrap<LeadDto>(res);
}

export interface CreateLeadInput {
  vertical: LeadVertical;
  customerId?: number;
  siteId?: number;
  statusId: number;
  assignedToId?: number;
  source?: LeadSource;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export async function createLead(input: CreateLeadInput) {
  const res = await apiClient.post<never>('/leads', input);
  return unwrap<LeadDto>(res);
}

export async function updateLead(id: number, input: Partial<CreateLeadInput>) {
  const res = await apiClient.patch<never>(`/leads/${id}`, input);
  return unwrap<LeadDto>(res);
}

export async function assignLead(id: number, assignedToId: number) {
  const res = await apiClient.post<never>(`/leads/${id}/assign`, { assignedToId });
  return unwrap<LeadDto>(res);
}

export async function transitionLead(id: number, statusId: number, remarks?: string) {
  const res = await apiClient.post<never>(`/leads/${id}/transition`, { statusId, remarks });
  return unwrap<LeadDto>(res);
}

export async function deleteLead(id: number) {
  await apiClient.delete(`/leads/${id}`);
}
