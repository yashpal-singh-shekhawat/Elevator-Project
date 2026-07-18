import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { AmcVisitDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListAmcVisitsParams extends ListQueryParams {
  amcContractId?: number;
  liftId?: number;
  technicianId?: number;
  statusId?: number;
}

export async function listAmcVisits(params: ListAmcVisitsParams) {
  const res = await apiClient.get<never>('/amc-visits', { params });
  return unwrapList<AmcVisitDto>(res);
}

export interface CreateAmcVisitInput {
  amcContractId: number;
  amcScheduleId?: number;
  liftId: number;
  serviceTypeId: number;
  statusId: number;
  technicianId?: number;
  visitDate: string;
}

export async function createAmcVisit(input: CreateAmcVisitInput) {
  const res = await apiClient.post<never>('/amc-visits', input);
  return unwrap<AmcVisitDto>(res);
}

export interface UpdateAmcVisitInput {
  statusId?: number;
  technicianId?: number | null;
  visitDate?: string;
  findings?: string;
  actionsTaken?: string;
  nextServiceDate?: string;
}

export async function updateAmcVisit(id: number, input: UpdateAmcVisitInput) {
  const res = await apiClient.patch<never>(`/amc-visits/${id}`, input);
  return unwrap<AmcVisitDto>(res);
}
