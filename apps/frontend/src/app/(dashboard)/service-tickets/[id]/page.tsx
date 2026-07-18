'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useServiceTicket, useStartTicket, useCloseTicket } from '@/hooks/queries/use-service-tickets';
import { useMaterialRequests } from '@/hooks/queries/use-material-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { CategorizeDialog } from './categorize-dialog';
import { AssignDialog } from './assign-dialog';
import { ResolveDialog } from './resolve-dialog';
import { CreateMaterialRequestDialog } from './create-material-request-dialog';

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  NORMAL: 'secondary',
  LOW: 'outline'
};

export default function ServiceTicketDetailPage({ params }: { params: { id: string } }) {
  const ticketId = Number(params.id);
  const { data: ticket, isLoading } = useServiceTicket(ticketId);
  const startTicket = useStartTicket();
  const closeTicket = useCloseTicket();
  const { data: materialRequests } = useMaterialRequests({ serviceTicketId: ticketId, limit: 20 });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return <p className="text-sm text-muted-foreground">Ticket not found.</p>;
  }

  const code = ticket.status.code;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/service-tickets" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{ticket.ticketCode}</h1>
          <StatusBadge status={ticket.status} />
          <Badge variant={PRIORITY_VARIANT[ticket.priorityFlag] ?? 'outline'}>{ticket.priorityFlag}</Badge>
          {ticket.passengerEntrapped && <Badge variant="destructive">Passenger entrapped</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Contract <span className="font-mono">{ticket.amcContract.contractNumber}</span> · Lift{' '}
          <span className="font-mono">{ticket.lift.serialNumber}</span> · Source: {ticket.source}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {code === 'TICKET_OPENED' && <CategorizeDialog ticketId={ticket.id} />}
        {(code === 'TRIAGED' || code === 'TECHNICIAN_ASSIGNED') && <AssignDialog ticketId={ticket.id} />}
        {code === 'TECHNICIAN_ASSIGNED' && (
          <Button variant="outline" size="sm" onClick={() => startTicket.mutate(ticket.id)} disabled={startTicket.isPending}>
            {startTicket.isPending ? 'Starting…' : 'Start visit'}
          </Button>
        )}
        {code === 'IN_PROGRESS' && <ResolveDialog ticketId={ticket.id} />}
        {code === 'RESOLVED' && (
          <Button size="sm" onClick={() => closeTicket.mutate(ticket.id)} disabled={closeTicket.isPending}>
            {closeTicket.isPending ? 'Closing…' : 'Close ticket'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row label="Category" value={ticket.categoryTag ?? 'Uncategorized'} />
            <Row label="Assigned to" value={ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Unassigned'} />
            <Row label="Created" value={new Date(ticket.createdAt).toLocaleString()} />
            {ticket.resolvedAt && <Row label="Resolved" value={new Date(ticket.resolvedAt).toLocaleString()} />}
            {ticket.closedAt && <Row label="Closed" value={new Date(ticket.closedAt).toLocaleString()} />}
            {ticket.nextServiceDate && <Row label="Next service" value={new Date(ticket.nextServiceDate).toLocaleDateString()} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Findings &amp; recommendations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Findings</p>
              <p className="mt-1">{ticket.findings || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommendations</p>
              <p className="mt-1">{ticket.recommendations || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Material requests</CardTitle>
          <CreateMaterialRequestDialog serviceTicketId={ticket.id} />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {materialRequests?.items.length === 0 && <p className="text-sm text-muted-foreground">No material requests raised for this ticket.</p>}
          {materialRequests?.items.map((mrd) => (
            <div key={mrd.id} className="flex items-center justify-between rounded-[var(--radius)] border border-border px-3 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs">{mrd.mrdCode}</span>
                <span className="text-muted-foreground">
                  {mrd.lineItems.length} item{mrd.lineItems.length === 1 ? '' : 's'}
                </span>
                <Badge variant={mrd.coverageEligible ? 'success' : 'outline'}>{mrd.coverageEligible ? 'Covered' : 'Billable'}</Badge>
              </div>
              <StatusBadge status={mrd.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
