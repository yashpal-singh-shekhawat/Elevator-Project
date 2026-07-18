'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/roles';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';
import type { CreateRoleInput, UpdateRoleInput } from '@lift-saas/shared-types';

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  detail: (id: number) => [...roleKeys.all, 'detail', id] as const,
  permissions: () => [...roleKeys.all, 'permissions'] as const
};

export function useRoles() {
  return useQuery({ queryKey: roleKeys.list(), queryFn: () => api.listRoles() });
}

export function usePermissionCatalog() {
  return useQuery({ queryKey: roleKeys.permissions(), queryFn: () => api.listPermissions() });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => api.createRole(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
      toast({ title: 'Role created', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to create role', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateRole(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRoleInput) => api.updateRole(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
      toast({ title: 'Role updated', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to update role', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useSetRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionCodes }: { id: number; permissionCodes: string[] }) =>
      api.setRolePermissions(id, permissionCodes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
      toast({ title: 'Permissions saved', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to save permissions', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
      toast({ title: 'Role deleted', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to delete role', description: getErrorMessage(err), variant: 'destructive' })
  });
}
