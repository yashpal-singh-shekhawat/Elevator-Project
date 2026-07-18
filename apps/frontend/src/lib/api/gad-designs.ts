import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { GadDesignDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListGadDesignsParams extends ListQueryParams {
  installationProjectId?: number;
}

export async function listGadDesigns(params: ListGadDesignsParams) {
  const res = await apiClient.get<never>('/gad-designs', { params });
  return unwrapList<GadDesignDto>(res);
}

export interface CreateGadDesignInput {
  installationProjectId: number;
  preparedById?: number;
  fileUrl?: string;
  notes?: string;
}

export async function createGadDesign(input: CreateGadDesignInput) {
  const res = await apiClient.post<never>('/gad-designs', input);
  return unwrap<GadDesignDto>(res);
}

export async function updateGadDesign(id: number, input: { fileUrl?: string; notes?: string }) {
  const res = await apiClient.patch<never>(`/gad-designs/${id}`, input);
  return unwrap<GadDesignDto>(res);
}

export async function submitGadDesign(id: number) {
  const res = await apiClient.post<never>(`/gad-designs/${id}/submit`, {});
  return unwrap<GadDesignDto>(res);
}

export async function approveGadDesign(id: number) {
  const res = await apiClient.post<never>(`/gad-designs/${id}/approve`, {});
  return unwrap<GadDesignDto>(res);
}

export async function requestGadDesignChanges(id: number, revisionNotes: string) {
  const res = await apiClient.post<never>(`/gad-designs/${id}/request-changes`, { revisionNotes });
  return unwrap<GadDesignDto>(res);
}
