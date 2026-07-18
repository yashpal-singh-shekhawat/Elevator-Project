'use client';

import { useState } from 'react';
import { CheckCircle2, Plus, Truck, XCircle } from 'lucide-react';
import {
  useManufacturingOrders,
  useCreateManufacturingOrder,
  useQcPassManufacturingOrder,
  useQcFailManufacturingOrder,
  useMarkReadyForDispatch
} from '@/hooks/queries/use-manufacturing-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';

export function ManufacturingSection({ installationProjectId }: { installationProjectId: number }) {
  const { data: orders } = useManufacturingOrders({ installationProjectId, limit: 10 });
  const createOrder = useCreateManufacturingOrder();
  const qcPass = useQcPassManufacturingOrder();
  const qcFail = useQcFailManufacturingOrder();
  const readyForDispatch = useMarkReadyForDispatch();

  const [failingReasonFor, setFailingReasonFor] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const order = orders?.items[0];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Manufacturing</CardTitle>
        {!order && (
          <Button variant="outline" size="sm" onClick={() => createOrder.mutate({ installationProjectId })}>
            <Plus className="h-3.5 w-3.5" /> Release order
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!order && <p className="text-sm text-muted-foreground">No manufacturing order released yet.</p>}
        {order && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-muted-foreground">{order.orderCode}</p>
              <StatusBadge status={order.status} />
            </div>
            {order.notes && <p className="text-xs text-muted-foreground">{order.notes}</p>}

            {order.status.code === 'QC_PENDING' && failingReasonFor !== order.id && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => qcPass.mutate(order.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> QC Pass
                </Button>
                <Button size="sm" variant="outline" onClick={() => setFailingReasonFor(order.id)}>
                  <XCircle className="h-3.5 w-3.5" /> QC Fail
                </Button>
              </div>
            )}

            {failingReasonFor === order.id && (
              <div className="flex gap-2">
                <Input placeholder="Failure reason…" value={reason} onChange={(e) => setReason(e.target.value)} className="h-8 text-xs" />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!reason.trim()}
                  onClick={() => {
                    qcFail.mutate({ id: order.id, reason });
                    setReason('');
                    setFailingReasonFor(null);
                  }}
                >
                  Confirm
                </Button>
              </div>
            )}

            {order.status.code === 'QC_PASSED' && (
              <Button size="sm" variant="outline" className="w-fit" onClick={() => readyForDispatch.mutate(order.id)}>
                <Truck className="h-3.5 w-3.5" /> Mark ready for dispatch
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
