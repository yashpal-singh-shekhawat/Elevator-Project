import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { InstallationMilestoneDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListInstallationMilestonesParams extends ListQueryParams {
  installationProjectId: number;
}

export async function listInstallationMilestones(params: ListInstallationMilestonesParams) {
  const res = await apiClient.get<never>('/installation-milestones', { params });
  return unwrapList<InstallationMilestoneDto>(res);
}

export interface CreateInstallationMilestoneInput {
  installationProjectId: number;
  name: string;
  statusId: number;
  remarks?: string;
}

export async function createInstallationMilestone(input: CreateInstallationMilestoneInput) {
  const res = await apiClient.post<never>('/installation-milestones', input);
  return unwrap<InstallationMilestoneDto>(res);
}

export async function signOffInstallationMilestone(id: number, remarks?: string) {
  const res = await apiClient.post<never>(`/installation-milestones/${id}/sign-off`, { remarks });
  return unwrap<InstallationMilestoneDto>(res);
}
