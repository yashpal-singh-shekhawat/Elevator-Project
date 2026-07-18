'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/installation-tasks';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

const taskKeys = {
  list: (params: api.ListInstallationTasksParams) => ['installation-tasks', 'list', params] as const
};

export function useInstallationTasks(params: api.ListInstallationTasksParams) {
  return useQuery({ queryKey: taskKeys.list(params), queryFn: () => api.listInstallationTasks(params) });
}

export function useCreateInstallationTask(installationProjectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<api.CreateInstallationTaskInput, 'installationProjectId'>) =>
      api.createInstallationTask({ ...input, installationProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-tasks'] });
      toast({ title: 'Task added', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to add task', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateInstallationTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: api.UpdateInstallationTaskInput }) => api.updateInstallationTask(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-tasks'] });
    },
    onError: (err) => toast({ title: 'Failed to update task', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useDeleteInstallationTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteInstallationTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-tasks'] });
      toast({ title: 'Task removed', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to remove task', description: getErrorMessage(err), variant: 'destructive' })
  });
}
