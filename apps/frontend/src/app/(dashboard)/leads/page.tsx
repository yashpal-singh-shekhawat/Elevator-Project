'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useLeads } from '@/hooks/queries/use-leads';
import { useStatuses, useUsers } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeadDto, LeadVertical } from '@lift-saas/shared-types';

export default function LeadsPage() {
  const [vertical, setVertical] = useState<LeadVertical>('INSTALLATION');
  const [search, setSearch] = useState('');
  const [assignedToId, setAssignedToId] = useState<number | undefined>(undefined);

  const { data: statuses } = useStatuses('LEAD');
  const { data: users } = useUsers();
  // Role codes vary per tenant (e.g. SALES_EXECUTIVE), so match by prefix and
  // fall back to all users if none qualify — keeps the filter usable.
  const preferredReps = users?.filter((u) => u.roleCode?.startsWith('SALES') || u.roleCode === 'ADMIN');
  const salesReps = preferredReps && preferredReps.length > 0 ? preferredReps : users;

  const { data, isLoading } = useLeads({ vertical, search: search || undefined, assignedToId, limit: 100 });

  const columns = useMemo(() => {
    if (!statuses) return [];
    const sorted = [...statuses].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.map((status) => ({
      status,
      leads: (data?.items ?? []).filter((lead) => lead.status.id === status.id)
    }));
  }, [statuses, data]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Sales pipeline — Installation &amp; AMC</p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="h-4 w-4" /> New Lead
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={vertical} onValueChange={(v) => setVertical(v as LeadVertical)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INSTALLATION">Installation</SelectItem>
            <SelectItem value="AMC">AMC</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contact/lead code…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Select
          value={assignedToId ? String(assignedToId) : 'all'}
          onValueChange={(v) => setAssignedToId(v === 'all' ? undefined : Number(v))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All sales reps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sales reps</SelectItem>
            {salesReps?.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.firstName} {u.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(({ status, leads }) => (
            <div key={status.id} className="flex w-72 shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-display text-sm font-semibold">{status.label}</h3>
                <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs text-secondary-foreground">
                  {leads.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                {leads.length === 0 && (
                  <p className="rounded-[var(--radius)] border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    No leads
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead }: { lead: LeadDto }) {
  return (
    <Link href={`/leads/${lead.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="flex flex-col gap-1.5 py-3">
          <p className="font-mono text-xs text-muted-foreground">{lead.leadCode}</p>
          <p className="text-sm font-medium">{lead.contactName ?? lead.customer?.name ?? 'Unnamed lead'}</p>
          {lead.site && <p className="text-xs text-muted-foreground">{lead.site.name}</p>}
          {lead.assignedTo && (
            <p className="text-xs text-muted-foreground">
              {lead.assignedTo.firstName} {lead.assignedTo.lastName}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
