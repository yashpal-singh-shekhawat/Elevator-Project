'use client';

import { useState } from 'react';
import { useMaterialRequests, useApproveMaterialRequest, useIssueFromStock, useRejectMaterialRequest } from '@/hooks/queries/use-material-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { RaisePODialog } from './raise-po-dialog';

export default function MaterialRequestsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMaterialRequests({ page, limit: 20 });
  const approve = useApproveMaterialRequest();
  const issueFromStock = useIssueFromStock();
  const reject = useRejectMaterialRequest();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Material Requests</h1>
        <p className="text-sm text-muted-foreground">MRDs raised against service tickets — approve, issue from stock, or raise a purchase order</p>
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MRD Code</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Raised By</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Line Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No material requests yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((mrd) => {
              const code = mrd.status.code;
              return (
                <TableRow key={mrd.id}>
                  <TableCell className="font-mono text-xs">{mrd.mrdCode}</TableCell>
                  <TableCell className="font-mono text-xs">#{mrd.serviceTicketId}</TableCell>
                  <TableCell>
                    {mrd.raisedBy.firstName} {mrd.raisedBy.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={mrd.coverageEligible ? 'success' : 'outline'}>{mrd.coverageEligible ? 'Covered' : 'Billable'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {mrd.lineItems.length} item{mrd.lineItems.length === 1 ? '' : 's'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={mrd.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {code === 'SUBMITTED' && (
                        <Button size="sm" variant="outline" onClick={() => approve.mutate(mrd.id)} disabled={approve.isPending}>
                          Approve
                        </Button>
                      )}
                      {code === 'APPROVED' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => issueFromStock.mutate(mrd.id)} disabled={issueFromStock.isPending}>
                            Issue from stock
                          </Button>
                          <RaisePODialog materialRequestId={mrd.id} />
                        </>
                      )}
                      {(code === 'SUBMITTED' || code === 'APPROVED') && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => reject.mutate(mrd.id)} disabled={reject.isPending}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </TableCell>
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
