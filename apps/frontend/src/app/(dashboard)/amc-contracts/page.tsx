'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useAmcContracts } from '@/hooks/queries/use-amc-contracts';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';

export default function AmcContractsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState<number | undefined>(undefined);

  const { data: statuses } = useStatuses('AMC_CONTRACT');
  const { data, isLoading } = useAmcContracts({ page, limit: 20, search: search || undefined, statusId });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">AMC Contracts</h1>
          <p className="text-sm text-muted-foreground">Service contracts, schedules, and visit history</p>
        </div>
        <Button asChild>
          <Link href="/amc-contracts/new">
            <Plus className="h-4 w-4" /> New Contract
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contract number…"
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
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Lift</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ends</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No AMC contracts yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-mono text-xs">
                  <Link href={`/amc-contracts/${contract.id}`} className="text-foreground hover:text-primary">
                    {contract.contractNumber}
                  </Link>
                </TableCell>
                <TableCell>{contract.customer.name}</TableCell>
                <TableCell className="font-mono text-xs">{contract.lift.serialNumber}</TableCell>
                <TableCell>{contract.serviceType.name}</TableCell>
                <TableCell>
                  <StatusBadge status={contract.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(contract.endDate).toLocaleDateString()}</TableCell>
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
