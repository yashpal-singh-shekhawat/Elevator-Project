import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type { InstallationTaskDto, ListQueryParams } from '@lift-saas/shared-types';

export interface ListInstallationTasksParams extends ListQueryParams {
  installationProjectId: number;
  statusId?: number;
}

export async function listInstallationTasks(params: ListInstallationTasksParams) {
  const res = await apiClient.get<never>('/installation-tasks', { params });
  return unwrapList<InstallationTaskDto>(res);
}

export interface CreateInstallationTaskInput {
  installationProjectId: number;
  title: string;
  description?: string;
  statusId: number;
  sequence?: number;
  assignedToId?: number;
  dueDate?: string;
}

export async function createInstallationTask(input: CreateInstallationTaskInput) {
  const res = await apiClient.post<never>('/installation-tasks', input);
  return unwrap<InstallationTaskDto>(res);
}

export interface UpdateInstallationTaskInput {
  title?: string;
  description?: string;
  statusId?: number;
  sequence?: number;
  assignedToId?: number | null;
  dueDate?: string;
}

export async function updateInstallationTask(id: number, input: UpdateInstallationTaskInput) {
  const res = await apiClient.patch<never>(`/installation-tasks/${id}`, input);
  return unwrap<InstallationTaskDto>(res);
}

export async function deleteInstallationTask(id: number) {
  await apiClient.delete(`/installation-tasks/${id}`);
}
