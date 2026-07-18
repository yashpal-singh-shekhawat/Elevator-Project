import { apiClient } from '@/lib/api-client';
import { unwrap } from './unwrap';
import type { WorkflowTransitionDto } from '@lift-saas/shared-types';

// Read-only timeline — writes happen automatically inside other modules' actions.
// Unlike most list endpoints (which return a plain array in `data`), this one
// wraps the rows in a nested paginated envelope: data -> { data: [], total,
// page, limit, totalPages }. Unwrap that inner shape so callers always get a
// clean array back.
export async function listWorkflowTransitions(entityType: string, entityId: number, page = 1, limit = 50) {
  const res = await apiClient.get<never>('/workflow-transitions', { params: { entityType, entityId, page, limit } });
  const payload = unwrap<{ data?: WorkflowTransitionDto[] } | WorkflowTransitionDto[]>(res);
  // Tolerate both shapes: a nested `{ data: [...] }` envelope or a bare array.
  const items = Array.isArray(payload) ? payload : payload?.data ?? [];
  return { items };
}
