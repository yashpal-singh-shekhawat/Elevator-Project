'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/installation-milestones';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

const milestoneKeys = {
  list: (params: api.ListInstallationMilestonesParams) => ['installation-milestones', 'list', params] as const
};

export function useInstallationMilestones(params: api.ListInstallationMilestonesParams) {
  return useQuery({ queryKey: milestoneKeys.list(params), queryFn: () => api.listInstallationMilestones(params) });
}

export function useCreateInstallationMilestone(installationProjectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<api.CreateInstallationMilestoneInput, 'installationProjectId'>) =>
      api.createInstallationMilestone({ ...input, installationProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-milestones'] });
      toast({ title: 'Milestone added', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to add milestone', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useSignOffInstallationMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks?: string }) => api.signOffInstallationMilestone(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-milestones'] });
      toast({ title: 'Milestone signed off', variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to sign off milestone', description: getErrorMessage(err), variant: 'destructive' })
  });
}
