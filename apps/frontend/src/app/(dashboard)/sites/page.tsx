'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useSitesList, useDeleteSite } from '@/hooks/queries/use-sites-list';
import { usePermissions } from '@/hooks/use-permissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { CreateSiteDialog } from './create-site-dialog';
import { EditSiteDialog } from './edit-site-dialog';

export default function SitesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSitesList({ page, limit: 20, search: search || undefined });
  const { can } = usePermissions();
  const canManage = can('customer.manage');
  const deleteSite = useDeleteSite();

  const colCount = canManage ? 5 : 4;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground">Customer premises where lifts are installed and serviced</p>
        </div>
        {canManage && <CreateSiteDialog />}
      </div>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search site name…"
          className="pl-8"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site Name</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>City</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colCount}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={colCount} className="py-8 text-center text-sm text-muted-foreground">
                  No sites yet. Create a customer first, then add their site.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-medium">{site.name}</TableCell>
                <TableCell className="text-muted-foreground">{site.customer?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{site.addressLine1}</TableCell>
                <TableCell className="text-muted-foreground">{site.city ?? '—'}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditSiteDialog site={site} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete site "${site.name}"?`)) deleteSite.mutate(site.id);
                        }}
                        disabled={deleteSite.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                )}
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
