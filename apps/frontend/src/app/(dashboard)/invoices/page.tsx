'use client';

import { useState } from 'react';
import { useInvoices, useSendInvoice, useMarkInvoicePaid } from '@/hooks/queries/use-invoices';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { CreateInvoiceDialog } from './create-invoice-dialog';

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInvoices({ page, limit: 20 });
  const sendInvoice = useSendInvoice();
  const markPaid = useMarkInvoicePaid();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Billing for AMC contracts and non-covered service tickets</p>
        </div>
        <CreateInvoiceDialog />
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Code</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Total</TableHead>
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
                  No invoices yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((invoice) => {
              const code = invoice.status.code;
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs">{invoice.invoiceCode}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.entityType} #{invoice.entityId}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(invoice.issuedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="font-medium">{invoice.totalAmount}</TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {code === 'DRAFT' && (
                        <Button size="sm" variant="outline" onClick={() => sendInvoice.mutate(invoice.id)} disabled={sendInvoice.isPending}>
                          Send
                        </Button>
                      )}
                      {(code === 'SENT' || code === 'PARTIALLY_PAID' || code === 'OVERDUE') && (
                        <Button size="sm" onClick={() => markPaid.mutate({ id: invoice.id })} disabled={markPaid.isPending}>
                          Mark paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="px-3">
          <PaginationControls meta={data?.meta} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
