'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/installation-projects';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export const installationProjectKeys = {
  all: ['installation-projects'] as const,
  list: (params: api.ListInstallationProjectsParams) => [...installationProjectKeys.all, 'list', params] as const,
  detail: (id: number) => [...installationProjectKeys.all, 'detail', id] as const
};

export function useInstallationProjects(params: api.ListInstallationProjectsParams) {
  return useQuery({
    queryKey: installationProjectKeys.list(params),
    queryFn: () => api.listInstallationProjects(params)
  });
}

export function useInstallationProject(id: number) {
  return useQuery({
    queryKey: installationProjectKeys.detail(id),
    queryFn: () => api.getInstallationProject(id),
    enabled: Number.isFinite(id)
  });
}

export function useCreateInstallationProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createInstallationProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installationProjectKeys.all });
      toast({ title: 'Project created', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to create project', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useUpdateInstallationProject(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.UpdateInstallationProjectInput) => api.updateInstallationProject(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installationProjectKeys.all });
      toast({ title: 'Project updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to update project', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useCompleteInstallationProject(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: api.CompleteInstallationProjectInput) => api.completeInstallationProject(id, input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: installationProjectKeys.all });
      toast({ title: 'Project completed', description: `Lift ${result.lift.serialNumber} created`, variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to complete project', description: getErrorMessage(err), variant: 'destructive' })
  });
}

// --- v2 extended actions ---

export function useTransitionInstallationProject(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ toStatusCode, remarks }: { toStatusCode: string; remarks?: string }) =>
      api.transitionInstallationProject(id, toStatusCode, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installationProjectKeys.all });
      queryClient.invalidateQueries({ queryKey: ['workflow-transitions'] });
      toast({ title: 'Project stage updated', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to update stage', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useAssignInstallationEngineer(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => api.assignInstallationEngineer(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installationProjectKeys.all });
      toast({ title: 'Engineer assigned', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to assign engineer', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useSignOffInstallationProject(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ signedByName, remarks }: { signedByName: string; remarks?: string }) =>
      api.signOffInstallationProject(id, signedByName, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: installationProjectKeys.all });
      queryClient.invalidateQueries({ queryKey: ['workflow-transitions'] });
      toast({ title: 'Client sign-off recorded', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to record sign-off', description: getErrorMessage(err), variant: 'destructive' })
  });
}
