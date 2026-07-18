import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';

// The list/detail endpoints hydrate the flat LiftDto with its related site,
// lift-type and status (see lift.repository include), so we describe that
// richer shape here for the table.
export interface LiftListItem {
  id: number;
  serialNumber: string;
  model?: string | null;
  capacityKg?: number | null;
  numberOfFloors?: number | null;
  site: { id: number; name: string; customerId: number };
  liftType: { id: number; code: string; name: string };
  status: { id: number; code: string; label: string; color?: string | null };
}

export interface ListLiftsParams {
  search?: string;
  siteId?: number;
  liftTypeId?: number;
  statusId?: number;
  page?: number;
  limit?: number;
}

export interface CreateLiftInput {
  siteId: number;
  liftTypeId: number;
  statusId: number;
  serialNumber: string;
  model?: string;
  capacityKg?: number;
  numberOfFloors?: number;
  installationDate?: string;
  warrantyExpiryDate?: string;
}

export async function listLifts(params?: ListLiftsParams) {
  const res = await apiClient.get<never>('/lifts', { params });
  return unwrapList<LiftListItem>(res);
}

export async function getLift(id: number) {
  const res = await apiClient.get<never>(`/lifts/${id}`);
  return unwrap<LiftListItem>(res);
}

export async function createLift(input: CreateLiftInput) {
  const res = await apiClient.post<never>('/lifts', input);
  return unwrap<LiftListItem>(res);
}

export async function updateLift(id: number, input: Partial<Omit<CreateLiftInput, 'siteId'>>) {
  const res = await apiClient.patch<never>(`/lifts/${id}`, input);
  return unwrap<LiftListItem>(res);
}

export async function deleteLift(id: number) {
  await apiClient.delete(`/lifts/${id}`);
}
