import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { BreakdownEscalationDto, AcknowledgeEscalationInput } from '@lift-saas/shared-types';

export interface ListEscalationsParams {
  statusId?: number;
  liftId?: number;
  page?: number;
  limit?: number;
}

export async function listBreakdownEscalations(params?: ListEscalationsParams) {
  const res = await apiClient.get<never>('/breakdown-escalations', { params });
  return unwrapList<BreakdownEscalationDto>(res);
}

export async function getBreakdownEscalation(id: number) {
  const res = await apiClient.get<never>(`/breakdown-escalations/${id}`);
  return unwrap<BreakdownEscalationDto>(res);
}

export async function acknowledgeEscalation(id: number, input: AcknowledgeEscalationInput) {
  const res = await apiClient.post<never>(`/breakdown-escalations/${id}/acknowledge`, input);
  return unwrap<BreakdownEscalationDto>(res);
}
