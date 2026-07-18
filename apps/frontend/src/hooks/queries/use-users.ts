'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/users';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';
import type { CreateTenantUserInput, UpdateTenantUserInput } from '@lift-saas/shared-types';

export const userKeys = {
  all: ['users'] as const,
  list: (params?: api.ListUsersParams) => [...userKeys.all, 'list', params] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const
};

export function useUsers(params?: api.ListUsersParams) {
  return useQuery({ queryKey: userKeys.list(params), queryFn: () => api.listUsers(params) });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => api.getUser(id),
    enabled: Number.isFinite(id) && id > 0
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTenantUserInput) => api.createUser(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast({ title: 'User created', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to create user', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantUserInput) => api.updateUser(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast({ title: 'User updated', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to update user', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all });
      toast({ title: 'User removed', variant: 'success' });
    },
    onError: (err) =>
      toast({ title: 'Failed to remove user', description: getErrorMessage(err), variant: 'destructive' })
  });
}
