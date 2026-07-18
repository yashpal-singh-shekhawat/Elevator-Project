'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SlidersHorizontal } from 'lucide-react';
import { useAdjustStock } from '@/hooks/queries/use-inventory';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  quantity: z.coerce.number().int().refine((v) => v !== 0, { message: 'Enter a non-zero adjustment (use negative to deduct)' }),
  reason: z.string().trim().min(1, 'Reason is required')
});

type FormValues = z.infer<typeof schema>;

export function AdjustStockDialog({ stockId, partName }: { stockId: number; partName: string }) {
  const [open, setOpen] = useState(false);
  const adjustStock = useAdjustStock(stockId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await adjustStock.mutateAsync(values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {partName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">Quantity change</Label>
            <Input id="quantity" type="number" placeholder="e.g. 10 or -5" {...register('quantity')} />
            <p className="text-xs text-muted-foreground">Positive to add stock, negative to deduct.</p>
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" placeholder="e.g. Physical count correction" {...register('reason')} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Apply adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
