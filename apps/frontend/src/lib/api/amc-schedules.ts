import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { AmcScheduleDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListAmcSchedulesParams extends ListQueryParams {
  amcContractId: number;
  statusId?: number;
}

export async function listAmcSchedules(params: ListAmcSchedulesParams) {
  const res = await apiClient.get<never>('/amc-schedules', { params });
  return unwrapList<AmcScheduleDto>(res);
}

export interface GenerateAmcSchedulesInput {
  amcContractId: number;
  serviceTypeId?: number;
}

export async function generateAmcSchedules(input: GenerateAmcSchedulesInput) {
  const res = await apiClient.post<never>('/amc-schedules/generate', input);
  return unwrap<{ generatedCount: number; scheduledDates: string[] }>(res);
}
