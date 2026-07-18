import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { DispatchDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListDispatchesParams extends ListQueryParams {
  installationProjectId?: number;
}

export async function listDispatches(params: ListDispatchesParams) {
  const res = await apiClient.get<never>('/dispatches', { params });
  return unwrapList<DispatchDto>(res);
}

export interface CreateDispatchInput {
  manufacturingOrderId: number;
  installationProjectId: number;
  waybillNumber?: string;
  carrierName?: string;
  estimatedDeliveryDate?: string;
  notes?: string;
}

export async function createDispatch(input: CreateDispatchInput) {
  const res = await apiClient.post<never>('/dispatches', input);
  return unwrap<DispatchDto>(res);
}

export async function updateDispatch(id: number, input: Partial<Omit<CreateDispatchInput, 'manufacturingOrderId' | 'installationProjectId'>>) {
  const res = await apiClient.patch<never>(`/dispatches/${id}`, input);
  return unwrap<DispatchDto>(res);
}

export async function validateDelivery(id: number, hasException: boolean, exceptionNotes?: string) {
  const res = await apiClient.post<never>(`/dispatches/${id}/validate-delivery`, { hasException, exceptionNotes });
  return unwrap<DispatchDto>(res);
}
