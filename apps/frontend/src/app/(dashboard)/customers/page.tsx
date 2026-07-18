'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useCustomers, useDeleteCustomer } from '@/hooks/queries/use-customers';
import { usePermissions } from '@/hooks/use-permissions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { CreateCustomerDialog } from './create-customer-dialog';
import { EditCustomerDialog } from './edit-customer-dialog';

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useCustomers({ page, limit: 20, search: search || undefined });
  const { can } = usePermissions();
  const canManage = can('customer.manage');
  const deleteCustomer = useDeleteCustomer();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Customer directory for sites, leads and installations</p>
        </div>
        {canManage && <CreateCustomerDialog />}
      </div>

      <div className="relative w-64">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customer name…"
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GST</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canManage ? 5 : 4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-8 text-center text-sm text-muted-foreground">
                  No customers yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-muted-foreground">{customer.email ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{customer.phone ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{customer.gstNumber ?? '—'}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <EditCustomerDialog customer={customer} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete customer "${customer.name}"?`)) deleteCustomer.mutate(customer.id);
                        }}
                        disabled={deleteCustomer.isPending}
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
