import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { ChecklistItemDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListChecklistItemsParams extends ListQueryParams {
  entityType: 'INSTALLATION_TASK' | 'AMC_VISIT';
  entityId: number;
}

export async function listChecklistItems(params: ListChecklistItemsParams) {
  const res = await apiClient.get<never>('/checklist-items', { params });
  return unwrapList<ChecklistItemDto>(res);
}

export interface CreateChecklistItemInput {
  entityType: 'INSTALLATION_TASK' | 'AMC_VISIT';
  entityId: number;
  label: string;
  sortOrder?: number;
}

export async function createChecklistItem(input: CreateChecklistItemInput) {
  const res = await apiClient.post<never>('/checklist-items', input);
  return unwrap<ChecklistItemDto>(res);
}

export async function toggleChecklistItem(id: number, isChecked: boolean) {
  const res = await apiClient.patch<never>(`/checklist-items/${id}`, { isChecked });
  return unwrap<ChecklistItemDto>(res);
}

export async function deleteChecklistItem(id: number) {
  await apiClient.delete(`/checklist-items/${id}`);
}
