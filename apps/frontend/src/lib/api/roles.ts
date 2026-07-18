import { apiClient } from '@/lib/api-client';
import { unwrap } from './unwrap';
import type {
  RoleDto,
  PermissionGroupDto,
  CreateRoleInput,
  UpdateRoleInput
} from '@lift-saas/shared-types';

// Roles are returned as a plain (non-paginated) array — the tenant role
// catalogue is small and the checkbox matrix needs all of them at once.
export async function listRoles() {
  const res = await apiClient.get<never>('/roles');
  return unwrap<RoleDto[]>(res);
}

export async function getRole(id: number) {
  const res = await apiClient.get<never>(`/roles/${id}`);
  return unwrap<RoleDto>(res);
}

export async function listPermissions() {
  const res = await apiClient.get<never>('/roles/permissions');
  return unwrap<PermissionGroupDto[]>(res);
}

export async function createRole(input: CreateRoleInput) {
  const res = await apiClient.post<never>('/roles', input);
  return unwrap<RoleDto>(res);
}

export async function updateRole(id: number, input: UpdateRoleInput) {
  const res = await apiClient.patch<never>(`/roles/${id}`, input);
  return unwrap<RoleDto>(res);
}

export async function setRolePermissions(id: number, permissionCodes: string[]) {
  const res = await apiClient.put<never>(`/roles/${id}/permissions`, { permissionCodes });
  return unwrap<RoleDto>(res);
}

export async function deleteRole(id: number) {
  await apiClient.delete<never>(`/roles/${id}`);
}
