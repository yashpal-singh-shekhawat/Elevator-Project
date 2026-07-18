'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useLifts, useDeleteLift } from '@/hooks/queries/use-lifts';
import { usePermissions } from '@/hooks/use-permissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { CreateLiftDialog } from './create-lift-dialog';
import { EditLiftDialog } from './edit-lift-dialog';

export default function LiftsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useLifts({ page, limit: 20, search: search || undefined });
  const { can } = usePermissions();
  const canManage = can('lift.manage');
  const deleteLift = useDeleteLift();

  const colCount = canManage ? 6 : 5;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Lifts</h1>
          <p className="text-sm text-muted-foreground">Installed lift assets across customer sites</p>
        </div>
        {canManage && <CreateLiftDialog />}
      </div>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search serial number…"
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
              <TableHead>Serial No.</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Lift Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
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
                  No lifts yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((lift) => (
              <TableRow key={lift.id}>
                <TableCell className="font-mono text-xs">{lift.serialNumber}</TableCell>
                <TableCell>{lift.site?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{lift.liftType?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{lift.capacityKg ? `${lift.capacityKg} kg` : '—'}</TableCell>
                <TableCell>
                  <StatusBadge status={lift.status} />
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditLiftDialog lift={lift} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete lift "${lift.serialNumber}"?`)) deleteLift.mutate(lift.id);
                        }}
                        disabled={deleteLift.isPending}
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
