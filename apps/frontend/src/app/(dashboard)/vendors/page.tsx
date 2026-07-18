'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, PackageSearch } from 'lucide-react';
import { useVendors, useDeactivateVendor } from '@/hooks/queries/use-vendors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { CreateVendorDialog } from './create-vendor-dialog';

export default function VendorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useVendors({ page, limit: 20, search: search || undefined });
  const deactivate = useDeactivateVendor();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">Supplier directory for spare parts procurement</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/vendor-purchase-orders">
              <PackageSearch className="h-4 w-4" /> Purchase Orders
            </Link>
          </Button>
          <CreateVendorDialog />
        </div>
      </div>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendor name…"
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
              <TableHead>Vendor Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>BIS/ISI</TableHead>
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
                  No vendors yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-mono text-xs">{vendor.vendorCode}</TableCell>
                <TableCell>{vendor.name}</TableCell>
                <TableCell className="text-muted-foreground">{vendor.contactName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{vendor.contactPhone ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={vendor.bisIsiApproved ? 'success' : 'outline'}>{vendor.bisIsiApproved ? 'Approved' : 'Not approved'}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={vendor.isActive ? 'success' : 'destructive'}>{vendor.isActive ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {vendor.isActive && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate.mutate(vendor.id)} disabled={deactivate.isPending}>
                      Deactivate
                    </Button>
                  )}
                </TableCell>
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
