import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { ListQueryParams, PowerAvailability, SiteSurveyDto } from '@lift-saas/shared-types';

export interface ListSiteSurveysParams extends ListQueryParams {
  installationProjectId?: number;
}

export async function listSiteSurveys(params: ListSiteSurveysParams) {
  const res = await apiClient.get<never>('/site-surveys', { params });
  return unwrapList<SiteSurveyDto>(res);
}

export interface CreateSiteSurveyInput {
  installationProjectId: number;
  surveyedById?: number;
  surveyedAt?: string;
  pitDepthMm?: number;
  shaftWidthMm?: number;
  shaftDepthMm?: number;
  overheadClearanceMm?: number;
  powerAvailability?: PowerAvailability;
  powerVoltage?: number;
  machineRoomAvailable?: boolean;
  floorCount?: number;
  buildingType?: string;
  accessibilityNotes?: string;
  observations?: string;
}

export async function createSiteSurvey(input: CreateSiteSurveyInput) {
  const res = await apiClient.post<never>('/site-surveys', input);
  return unwrap<SiteSurveyDto>(res);
}

export async function updateSiteSurvey(id: number, input: Partial<Omit<CreateSiteSurveyInput, 'installationProjectId'>>) {
  const res = await apiClient.patch<never>(`/site-surveys/${id}`, input);
  return unwrap<SiteSurveyDto>(res);
}
