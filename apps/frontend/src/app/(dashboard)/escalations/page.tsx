'use client';

import { useState } from 'react';
import { useBreakdownEscalations } from '@/hooks/queries/use-breakdown-escalations';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { AcknowledgeDialog } from './acknowledge-dialog';

export default function EscalationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBreakdownEscalations({ page, limit: 20 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Breakdown Escalations</h1>
        <p className="text-sm text-muted-foreground">
          Lifts with 3+ closed service tickets within a 60-day window — review and decide whether to resolve within AMC or route to modernization
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Escalation Code</TableHead>
              <TableHead>Lift</TableHead>
              <TableHead>Triggered</TableHead>
              <TableHead>Breakdown count</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Reviewed by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No escalations — all lifts within normal breakdown thresholds.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((esc) => {
              const code = esc.status.code;
              return (
                <TableRow key={esc.id}>
                  <TableCell className="font-mono text-xs">{esc.escalationCode}</TableCell>
                  <TableCell className="font-mono text-xs">{esc.lift.serialNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(esc.triggeredAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{esc.breakdownCount}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{esc.windowDays} days</TableCell>
                  <TableCell className="text-muted-foreground">{esc.reviewedBy ? `${esc.reviewedBy.firstName} ${esc.reviewedBy.lastName}` : '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={esc.status} />
                  </TableCell>
                  <TableCell className="text-right">{(code === 'OPEN' || code === 'UNDER_REVIEW') && <AcknowledgeDialog escalationId={esc.id} />}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="px-3">
          <PaginationControls meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
