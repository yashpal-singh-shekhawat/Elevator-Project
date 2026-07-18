'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useVendorPOs, useSendVendorPO } from '@/hooks/queries/use-vendors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { CreatePODialog } from './create-po-dialog';
import { ReceiveGrnDialog } from './receive-grn-dialog';

export default function VendorPurchaseOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVendorPOs({ page, limit: 20 });
  const sendPO = useSendVendorPO();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/vendors" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to vendors
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Purchase Orders</h1>
            <p className="text-sm text-muted-foreground">Track vendor POs from draft through goods receipt</p>
          </div>
          <CreatePODialog />
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Code</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Expected delivery</TableHead>
              <TableHead>BIS/ISI</TableHead>
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
                  No purchase orders yet.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((po) => {
              const code = po.status.code;
              return (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs">{po.poCode}</TableCell>
                  <TableCell>{po.vendor.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={po.bisIsiCertFlag ? 'success' : 'outline'}>{po.bisIsiCertFlag ? 'Required' : 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{po.totalAmount ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={po.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {code === 'DRAFT' && (
                        <Button size="sm" variant="outline" onClick={() => sendPO.mutate(po.id)} disabled={sendPO.isPending}>
                          Send to vendor
                        </Button>
                      )}
                      {(code === 'SENT' || code === 'ACKNOWLEDGED') && <ReceiveGrnDialog poId={po.id} poCode={po.poCode} />}
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
