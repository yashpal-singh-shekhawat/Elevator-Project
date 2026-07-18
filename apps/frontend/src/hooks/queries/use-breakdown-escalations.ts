'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/breakdown-escalations';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';
import type { AcknowledgeEscalationInput } from '@lift-saas/shared-types';

export const escalationKeys = {
  all: ['breakdown-escalations'] as const,
  list: (params?: api.ListEscalationsParams) => [...escalationKeys.all, 'list', params] as const,
  detail: (id: number) => [...escalationKeys.all, 'detail', id] as const,
};

export function useBreakdownEscalations(params?: api.ListEscalationsParams) {
  return useQuery({ queryKey: escalationKeys.list(params), queryFn: () => api.listBreakdownEscalations(params) });
}

export function useBreakdownEscalation(id: number) {
  return useQuery({ queryKey: escalationKeys.detail(id), queryFn: () => api.getBreakdownEscalation(id), enabled: Number.isFinite(id) });
}

export function useAcknowledgeEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AcknowledgeEscalationInput }) => api.acknowledgeEscalation(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: escalationKeys.all });
      const msg = vars.input.resolution === 'ROUTED_TO_MODERNIZATION'
        ? 'Escalation routed to modernization'
        : 'Escalation resolved in AMC';
      toast({ title: msg, variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to acknowledge', description: getErrorMessage(err), variant: 'destructive' }),
  });
}
