'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/checklist-items';
import { toast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/api/unwrap';

const checklistKeys = {
  list: (params: api.ListChecklistItemsParams) => ['checklist-items', 'list', params] as const
};

export function useChecklistItems(params: api.ListChecklistItemsParams) {
  return useQuery({ queryKey: checklistKeys.list(params), queryFn: () => api.listChecklistItems(params) });
}

export function useCreateChecklistItem(entityType: api.ListChecklistItemsParams['entityType'], entityId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => api.createChecklistItem({ entityType, entityId, label }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-items'] }),
    onError: (err) => toast({ title: 'Failed to add checklist item', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isChecked }: { id: number; isChecked: boolean }) => api.toggleChecklistItem(id, isChecked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-items'] }),
    onError: (err) => toast({ title: 'Failed to update checklist item', description: getErrorMessage(err), variant: 'destructive' })
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteChecklistItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-items'] }),
    onError: (err) => toast({ title: 'Failed to remove checklist item', description: getErrorMessage(err), variant: 'destructive' })
  });
}
