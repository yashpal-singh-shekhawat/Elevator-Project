import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { ChecklistTemplateDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListChecklistTemplatesParams extends ListQueryParams {
  entityType?: string;
}

export async function listChecklistTemplates(params: ListChecklistTemplatesParams) {
  const res = await apiClient.get<never>('/checklist-templates', { params });
  return unwrapList<ChecklistTemplateDto>(res);
}

export async function getChecklistTemplate(id: number) {
  const res = await apiClient.get<never>(`/checklist-templates/${id}`);
  return unwrap<ChecklistTemplateDto>(res);
}

export interface CreateChecklistTemplateInput {
  name: string;
  description?: string;
  entityType: string;
  items: Array<{ label: string; sortOrder?: number }>;
}

export async function createChecklistTemplate(input: CreateChecklistTemplateInput) {
  const res = await apiClient.post<never>('/checklist-templates', input);
  return unwrap<ChecklistTemplateDto>(res);
}

// Instantiates real ChecklistItem rows on the target entity from this template.
export async function applyChecklistTemplate(id: number, entityType: string, entityId: number) {
  const res = await apiClient.post<never>(`/checklist-templates/${id}/apply`, { entityType, entityId });
  return unwrap<{ applied: number; templateName: string }>(res);
}
