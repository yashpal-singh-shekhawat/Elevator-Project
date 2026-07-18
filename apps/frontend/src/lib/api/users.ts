import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapList } from './unwrap';
import type {
  TenantUserDto,
  CreateTenantUserInput,
  UpdateTenantUserInput
} from '@lift-saas/shared-types';

export interface ListUsersParams {
  search?: string;
  roleId?: number;
  page?: number;
  limit?: number;
}

export async function listUsers(params?: ListUsersParams) {
  const res = await apiClient.get<never>('/users', { params });
  return unwrapList<TenantUserDto>(res);
}

export async function getUser(id: number) {
  const res = await apiClient.get<never>(`/users/${id}`);
  return unwrap<TenantUserDto>(res);
}

export async function createUser(input: CreateTenantUserInput) {
  const res = await apiClient.post<never>('/users', input);
  return unwrap<TenantUserDto>(res);
}

export async function updateUser(id: number, input: UpdateTenantUserInput) {
  const res = await apiClient.patch<never>(`/users/${id}`, input);
  return unwrap<TenantUserDto>(res);
}

export async function deleteUser(id: number) {
  await apiClient.delete<never>(`/users/${id}`);
}
