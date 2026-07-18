'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/checklist-templates';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

export function useChecklistTemplates(params: api.ListChecklistTemplatesParams) {
  return useQuery({ queryKey: ['checklist-templates', 'list', params], queryFn: () => api.listChecklistTemplates(params) });
}

export function useApplyChecklistTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entityType, entityId }: { id: number; entityType: string; entityId: number }) =>
      api.applyChecklistTemplate(id, entityType, entityId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      toast({ title: `Applied "${result.templateName}" — ${result.applied} items added`, variant: 'success' });
    },
    onError: (err) => toast({ title: 'Failed to apply template', description: getErrorMessage(err), variant: 'destructive' })
  });
}
