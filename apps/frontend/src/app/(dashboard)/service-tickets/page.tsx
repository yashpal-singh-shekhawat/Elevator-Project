'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Users as UsersIcon } from 'lucide-react';
import { useServiceTickets } from '@/hooks/queries/use-service-tickets';
import { useStatuses } from '@/hooks/queries/use-master-data';
import type { TicketPriority } from '@/lib/api/service-tickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';

const PRIORITY_VARIANT: Record<TicketPriority, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  NORMAL: 'secondary',
  LOW: 'outline'
};

export default function ServiceTicketsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState<number | undefined>(undefined);
  const [priorityFlag, setPriorityFlag] = useState<TicketPriority | undefined>(undefined);

  const { data: statuses } = useStatuses('SERVICE_TICKET');
  const { data, isLoading } = useServiceTickets({
    page,
    limit: 20,
    search: search || undefined,
    statusId,
    priorityFlag
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Service Tickets</h1>
          <p className="text-sm text-muted-foreground">Ticket triage — categorize, assign, and track field visits</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/service-tickets/workload">
              <UsersIcon className="h-4 w-4" /> Technician workload
            </Link>
          </Button>
          <Button asChild>
            <Link href="/service-tickets/new">
              <Plus className="h-4 w-4" /> New Ticket
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ticket code…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={statusId ? String(statusId) : 'all'}
          onValueChange={(value) => {
            setStatusId(value === 'all' ? undefined : Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses?.map((status) => (
              <SelectItem key={status.id} value={String(status.id)}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFlag ?? 'all'}
          onValueChange={(value) => {
            setPriorityFlag(value === 'all' ? undefined : (value as TicketPriority));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Contract</TableHead>
              <TableHead>Lift</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
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
                  No service tickets yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-xs">
                  <Link href={`/service-tickets/${ticket.id}`} className="text-foreground hover:text-primary">
                    {ticket.ticketCode}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs">{ticket.amcContract.contractNumber}</TableCell>
                <TableCell className="font-mono text-xs">{ticket.lift.serialNumber}</TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_VARIANT[ticket.priorityFlag as TicketPriority] ?? 'outline'}>
                    {ticket.priorityFlag}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{ticket.categoryTag ?? '—'}</TableCell>
                <TableCell>
                  {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-3">
          <PaginationControls meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
