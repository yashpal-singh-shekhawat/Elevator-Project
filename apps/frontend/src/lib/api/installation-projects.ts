import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { InstallationProjectDto, LiftDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListInstallationProjectsParams extends ListQueryParams {
  customerId?: number;
  siteId?: number;
  statusId?: number;
}

export async function listInstallationProjects(params: ListInstallationProjectsParams) {
  const res = await apiClient.get<never>('/installation-projects', { params });
  return unwrapList<InstallationProjectDto>(res);
}

export async function getInstallationProject(id: number) {
  const res = await apiClient.get<never>(`/installation-projects/${id}`);
  return unwrap<InstallationProjectDto>(res);
}

export interface CreateInstallationProjectInput {
  projectCode: string;
  customerId: number;
  siteId: number;
  liftTypeId: number;
  statusId: number;
  assignedEngineerId?: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export async function createInstallationProject(input: CreateInstallationProjectInput) {
  const res = await apiClient.post<never>('/installation-projects', input);
  return unwrap<InstallationProjectDto>(res);
}

export interface UpdateInstallationProjectInput {
  statusId?: number;
  assignedEngineerId?: number | null;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
}

export async function updateInstallationProject(id: number, input: UpdateInstallationProjectInput) {
  const res = await apiClient.patch<never>(`/installation-projects/${id}`, input);
  return unwrap<InstallationProjectDto>(res);
}

export interface CompleteInstallationProjectInput {
  serialNumber: string;
  model?: string;
  capacityKg?: number;
  numberOfFloors?: number;
  installationDate?: string;
  warrantyExpiryDate?: string;
}

export async function completeInstallationProject(id: number, input: CompleteInstallationProjectInput) {
  const res = await apiClient.post<never>(`/installation-projects/${id}/complete`, input);
  return unwrap<{ lift: LiftDto; project: InstallationProjectDto }>(res);
}

// --- v2 extended actions (installation-project-ext.routes.ts) ---

export async function transitionInstallationProject(id: number, toStatusCode: string, remarks?: string) {
  const res = await apiClient.post<never>(`/installation-projects/${id}/transition`, { toStatusCode, remarks });
  return unwrap<InstallationProjectDto>(res);
}

export async function assignInstallationEngineer(id: number, userId: number) {
  const res = await apiClient.post<never>(`/installation-projects/${id}/assign-engineer`, { userId });
  return unwrap<InstallationProjectDto>(res);
}

export async function signOffInstallationProject(id: number, signedByName: string, remarks?: string) {
  const res = await apiClient.post<never>(`/installation-projects/${id}/sign-off`, { signedByName, remarks });
  return unwrap<InstallationProjectDto>(res);
}
