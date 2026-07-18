'use client';

import { useQuery } from '@tanstack/react-query';
import { listWorkflowTransitions } from '@/lib/api/workflow-transitions';

export function useWorkflowTransitions(entityType: string, entityId: number) {
  return useQuery({
    queryKey: ['workflow-transitions', entityType, entityId],
    queryFn: () => listWorkflowTransitions(entityType, entityId),
    enabled: Number.isFinite(entityId)
  });
}
