'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useServiceTickets } from '@/hooks/queries/use-service-tickets';
import { useUsers } from '@/hooks/queries/use-master-data';
import type { ServiceTicketDto } from '@lift-saas/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  NORMAL: 'secondary',
  LOW: 'outline'
};

export default function TechnicianWorkloadPage() {
  const { data: users } = useUsers();
  // Role codes are DEPARTMENT_ROLE (e.g. SERVICE_ENGINEER), so match service
  // roles by prefix and fall back to all users if none qualify — otherwise the
  // board is empty.
  const preferred = (users ?? []).filter((u) => u.roleCode?.startsWith('SERVICE') || u.roleCode?.startsWith('TECHNICIAN'));
  const technicians = preferred.length > 0 ? preferred : (users ?? []);

  const { data, isLoading } = useServiceTickets({ limit: 200, sortBy: 'createdAt', sortOrder: 'asc' });
  const openTickets = (data?.items ?? []).filter((t) => t.status.code !== 'CLOSED');

  const unassigned = openTickets.filter((t) => !t.assignedTo);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/service-tickets" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Technician Workload</h1>
        <p className="text-sm text-muted-foreground">Open tickets grouped by assigned technician</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WorkloadColumn title="Unassigned" tickets={unassigned} />
          {technicians.map((tech) => (
            <WorkloadColumn
              key={tech.id}
              title={`${tech.firstName} ${tech.lastName}`}
              tickets={openTickets.filter((t) => t.assignedTo?.id === tech.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkloadColumn({ title, tickets }: { title: string; tickets: ServiceTicketDto[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant="secondary">{tickets.length}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {tickets.length === 0 && <p className="text-sm text-muted-foreground">No open tickets.</p>}
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/service-tickets/${ticket.id}`}
            className="flex flex-col gap-1 rounded-[var(--radius)] border border-border px-3 py-2.5 text-sm hover:border-primary/50"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">{ticket.ticketCode}</span>
              <Badge variant={PRIORITY_VARIANT[ticket.priorityFlag] ?? 'outline'}>{ticket.priorityFlag}</Badge>
            </div>
            <span className="font-mono text-xs text-muted-foreground">Lift {ticket.lift.serialNumber}</span>
            <StatusBadge status={ticket.status} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
