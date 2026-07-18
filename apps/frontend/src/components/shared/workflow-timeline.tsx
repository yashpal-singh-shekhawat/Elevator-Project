'use client';

import { Clock } from 'lucide-react';
import { useWorkflowTransitions } from '@/hooks/queries/use-workflow-transitions';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';

// Reusable audit-trail timeline — used by Lead detail and Installation Project
// detail alike, since WorkflowTransition is a generic entityType+entityId log.
export function WorkflowTimeline({ entityType, entityId }: { entityType: string; entityId: number }) {
  const { data, isLoading } = useWorkflowTransitions(entityType, entityId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  // Always coerce to an array so a `.map` can never crash, regardless of the
  // exact envelope shape the API returns.
  const raw = (data as any)?.items ?? (data as any)?.data ?? data;
  const transitions: any[] = Array.isArray(raw) ? raw : [];

  if (transitions.length === 0) {
    return <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {transitions.map((t: any) => (
        <div key={t.id} className="flex gap-3 border-l-2 border-border pl-3">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              {t.fromStatus && (
                <>
                  <StatusBadge status={t.fromStatus} />
                  <span className="text-muted-foreground">→</span>
                </>
              )}
              <StatusBadge status={t.toStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t.actionedBy.firstName} {t.actionedBy.lastName} · {new Date(t.createdAt).toLocaleString()}
            </p>
            {t.remarks && <p className="text-xs text-foreground">{t.remarks}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
