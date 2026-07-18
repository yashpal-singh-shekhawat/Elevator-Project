import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { ListQueryParams, ManufacturingOrderDto } from '@lift-saas/shared-types';

export interface ListManufacturingOrdersParams extends ListQueryParams {
  installationProjectId?: number;
}

export async function listManufacturingOrders(params: ListManufacturingOrdersParams) {
  const res = await apiClient.get<never>('/manufacturing-orders', { params });
  return unwrapList<ManufacturingOrderDto>(res);
}

export async function createManufacturingOrder(installationProjectId: number, notes?: string) {
  const res = await apiClient.post<never>('/manufacturing-orders', { installationProjectId, notes });
  return unwrap<ManufacturingOrderDto>(res);
}

export async function updateManufacturingOrder(id: number, notes: string) {
  const res = await apiClient.patch<never>(`/manufacturing-orders/${id}`, { notes });
  return unwrap<ManufacturingOrderDto>(res);
}

export async function qcPassManufacturingOrder(id: number) {
  const res = await apiClient.post<never>(`/manufacturing-orders/${id}/qc-pass`, {});
  return unwrap<ManufacturingOrderDto>(res);
}

export async function qcFailManufacturingOrder(id: number, reason: string) {
  const res = await apiClient.post<never>(`/manufacturing-orders/${id}/qc-fail`, { reason });
  return unwrap<ManufacturingOrderDto>(res);
}

export async function markReadyForDispatch(id: number) {
  const res = await apiClient.post<never>(`/manufacturing-orders/${id}/ready-for-dispatch`, {});
  return unwrap<ManufacturingOrderDto>(res);
}
