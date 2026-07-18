'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { useDispatches, useCreateDispatch, useValidateDelivery } from '@/hooks/queries/use-dispatches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/status-badge';

const schema = z.object({
  waybillNumber: z.string().trim().optional(),
  carrierName: z.string().trim().optional(),
  estimatedDeliveryDate: z.string().optional()
});
type FormValues = z.infer<typeof schema>;

export function DispatchSection({
  installationProjectId,
  manufacturingOrderId
}: {
  installationProjectId: number;
  manufacturingOrderId?: number;
}) {
  const { data: dispatches } = useDispatches({ installationProjectId, limit: 10 });
  const createDispatch = useCreateDispatch();
  const validateDelivery = useValidateDelivery();
  const [open, setOpen] = useState(false);
  const [flaggingException, setFlaggingException] = useState<number | null>(null);
  const [exceptionNotes, setExceptionNotes] = useState('');

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onCreate(values: FormValues) {
    if (!manufacturingOrderId) return;
    await createDispatch.mutateAsync({ ...values, manufacturingOrderId, installationProjectId });
    reset();
    setOpen(false);
  }

  const dispatch = dispatches?.items[0];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Dispatch</CardTitle>
        {!dispatch && manufacturingOrderId && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" /> Create dispatch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dispatch details</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="waybillNumber">Waybill number</Label>
                  <Input id="waybillNumber" {...register('waybillNumber')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="carrierName">Carrier</Label>
                  <Input id="carrierName" {...register('carrierName')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="estimatedDeliveryDate">Estimated delivery</Label>
                  <Input id="estimatedDeliveryDate" type="date" {...register('estimatedDeliveryDate')} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create dispatch'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!dispatch && (
          <p className="text-sm text-muted-foreground">
            {manufacturingOrderId ? 'No dispatch created yet.' : 'Waiting on manufacturing to be ready for dispatch.'}
          </p>
        )}
        {dispatch && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-muted-foreground">
                {dispatch.dispatchCode} {dispatch.waybillNumber ? `· ${dispatch.waybillNumber}` : ''}
              </p>
              <StatusBadge status={dispatch.status} />
            </div>
            {dispatch.carrierName && <p className="text-xs text-muted-foreground">Carrier: {dispatch.carrierName}</p>}
            {dispatch.exceptionNotes && <p className="text-xs text-destructive">Exception: {dispatch.exceptionNotes}</p>}

            {dispatch.status.code === 'IN_TRANSIT' && flaggingException !== dispatch.id && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => validateDelivery.mutate({ id: dispatch.id, hasException: false })}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Validate delivery
                </Button>
                <Button size="sm" variant="outline" onClick={() => setFlaggingException(dispatch.id)}>
                  <AlertTriangle className="h-3.5 w-3.5" /> Flag exception
                </Button>
              </div>
            )}

            {flaggingException === dispatch.id && (
              <div className="flex gap-2">
                <Input
                  placeholder="Describe the issue…"
                  value={exceptionNotes}
                  onChange={(e) => setExceptionNotes(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!exceptionNotes.trim()}
                  onClick={() => {
                    validateDelivery.mutate({ id: dispatch.id, hasException: true, exceptionNotes });
                    setExceptionNotes('');
                    setFlaggingException(null);
                  }}
                >
                  Confirm
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
