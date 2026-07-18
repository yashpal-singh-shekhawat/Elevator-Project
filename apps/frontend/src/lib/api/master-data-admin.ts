import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { StatusDto, LiftTypeDto, ServiceTypeDto } from '@lift-saas/shared-types';

// Admin CRUD for tenant master data. The read-only lookup helpers in
// ./master-data.ts stay untouched (they return bare arrays for dropdowns);
// this file returns the full paginated envelope for management tables.

// --- Statuses ---
export interface ListStatusesParams {
  entityType?: string;
  page?: number;
  limit?: number;
}

export interface CreateStatusInput {
  entityType: string;
  code: string;
  label: string;
  color?: string;
  sortOrder?: number;
}

export interface UpdateStatusInput {
  label?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export async function listStatusesAdmin(params?: ListStatusesParams) {
  const res = await apiClient.get<never>('/master-data/statuses', { params });
  return unwrapList<StatusDto>(res);
}

export async function createStatus(input: CreateStatusInput) {
  const res = await apiClient.post<never>('/master-data/statuses', input);
  return unwrap<StatusDto>(res);
}

export async function updateStatus(id: number, input: UpdateStatusInput) {
  const res = await apiClient.patch<never>(`/master-data/statuses/${id}`, input);
  return unwrap<StatusDto>(res);
}

// --- Lift types ---
export interface CreateTypeInput {
  code: string;
  name: string;
}

export interface UpdateTypeInput {
  name?: string;
  isActive?: boolean;
}

export async function listLiftTypesAdmin(params?: { page?: number; limit?: number }) {
  const res = await apiClient.get<never>('/master-data/lift-types', { params });
  return unwrapList<LiftTypeDto>(res);
}

export async function createLiftType(input: CreateTypeInput) {
  const res = await apiClient.post<never>('/master-data/lift-types', input);
  return unwrap<LiftTypeDto>(res);
}

export async function updateLiftType(id: number, input: UpdateTypeInput) {
  const res = await apiClient.patch<never>(`/master-data/lift-types/${id}`, input);
  return unwrap<LiftTypeDto>(res);
}

// --- Service types ---
export async function listServiceTypesAdmin(params?: { page?: number; limit?: number }) {
  const res = await apiClient.get<never>('/master-data/service-types', { params });
  return unwrapList<ServiceTypeDto>(res);
}

export async function createServiceType(input: CreateTypeInput) {
  const res = await apiClient.post<never>('/master-data/service-types', input);
  return unwrap<ServiceTypeDto>(res);
}

export async function updateServiceType(id: number, input: UpdateTypeInput) {
  const res = await apiClient.patch<never>(`/master-data/service-types/${id}`, input);
  return unwrap<ServiceTypeDto>(res);
}
