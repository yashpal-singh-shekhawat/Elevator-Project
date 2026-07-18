'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, Pencil, Power, PowerOff, Building2 } from 'lucide-react';
import type { TenantDto } from '@lift-saas/shared-types';
import { useTenants, useSetTenantStatus } from '@/hooks/queries/use-platform';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { TenantLogo } from '@/components/shared/tenant-logo';
import { TenantFormDialog } from './tenant-form-dialog';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

// Page wrapper: useSearchParams requires a Suspense boundary in the app router.
export default function TenantManagementPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>}>
      <TenantManagement />
    </Suspense>
  );
}

function TenantManagement() {
  const params = useSearchParams();

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<StatusFilter>(
    params.get('status') === 'INACTIVE' ? 'INACTIVE' : params.get('status') === 'ACTIVE' ? 'ACTIVE' : 'ALL'
  );
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(params.get('create') === '1');
  const [editing, setEditing] = useState<TenantDto | null>(null);

  const setStatusMutation = useSetTenantStatus();

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debounced || undefined,
      status: status === 'ALL' ? undefined : status
    }),
    [page, debounced, status]
  );

  const { data, isLoading } = useTenants(queryParams);
  const tenants = data?.items ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(t: TenantDto) {
    setEditing(t);
    setFormOpen(true);
  }

  function toggleStatus(t: TenantDto) {
    setStatusMutation.mutate({ id: t.id, isActive: t.status !== 'ACTIVE' });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Tenant Management</h1>
          <p className="text-sm text-muted-foreground">Companies provisioned on the ForceLift platform.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Create Tenant
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company, code, contact or email…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Orgs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-8 w-8 opacity-40" />
                    <p className="text-sm">
                      {debounced || status !== 'ALL'
                        ? 'No tenants match your filters.'
                        : 'No tenants yet. Create your first company.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <TenantLogo name={t.companyName} logoUrl={t.logoUrl} />
                      <span className="font-medium">{t.companyName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">/{t.companyUniqueCode}</TableCell>
                  <TableCell className="text-muted-foreground">{t.contactPerson ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{t.email ?? '—'}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{t.organizationCount ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === 'ACTIVE' ? 'success' : 'destructive'}>{t.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </Button>
                      {t.status === 'ACTIVE' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => toggleStatus(t)}
                          disabled={setStatusMutation.isPending}
                        >
                          <PowerOff className="h-4 w-4" /> Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success"
                          onClick={() => toggleStatus(t)}
                          disabled={setStatusMutation.isPending}
                        >
                          <Power className="h-4 w-4" /> Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <div className="px-3">
          <PaginationControls meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>

      <TenantFormDialog open={formOpen} onOpenChange={setFormOpen} tenant={editing} />
    </div>
  );
}
