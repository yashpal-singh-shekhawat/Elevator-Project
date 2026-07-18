import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { MaterialRequestDto, CreateMaterialRequestInput } from '@lift-saas/shared-types';

export interface ListMaterialRequestsParams {
  serviceTicketId?: number;
  page?: number;
  limit?: number;
}

export async function listMaterialRequests(params?: ListMaterialRequestsParams) {
  const res = await apiClient.get<never>('/material-requests', { params });
  return unwrapList<MaterialRequestDto>(res);
}

export async function getMaterialRequest(id: number) {
  const res = await apiClient.get<never>(`/material-requests/${id}`);
  return unwrap<MaterialRequestDto>(res);
}

export async function createMaterialRequest(input: CreateMaterialRequestInput) {
  const res = await apiClient.post<never>('/material-requests', input);
  return unwrap<MaterialRequestDto>(res);
}

export async function approveMaterialRequest(id: number) {
  const res = await apiClient.post<never>(`/material-requests/${id}/approve`, {});
  return unwrap<MaterialRequestDto>(res);
}

export async function issueFromStock(id: number) {
  const res = await apiClient.post<never>(`/material-requests/${id}/issue-from-stock`, {});
  return unwrap<MaterialRequestDto>(res);
}

export async function raisePO(id: number, vendorId: number) {
  const res = await apiClient.post<never>(`/material-requests/${id}/raise-po`, { vendorId });
  return unwrap<MaterialRequestDto>(res);
}

export async function rejectMaterialRequest(id: number) {
  const res = await apiClient.post<never>(`/material-requests/${id}/reject`, {});
  return unwrap<MaterialRequestDto>(res);
}
