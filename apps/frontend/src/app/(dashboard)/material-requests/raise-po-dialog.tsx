'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShoppingCart } from 'lucide-react';
import { useRaisePO } from '@/hooks/queries/use-material-requests';
import { useVendors } from '@/hooks/queries/use-vendors';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  vendorId: z.coerce.number().int().positive({ message: 'Select a vendor' })
});

type FormValues = z.infer<typeof schema>;

export function RaisePODialog({ materialRequestId }: { materialRequestId: number }) {
  const [open, setOpen] = useState(false);
  const raisePO = useRaisePO();
  const { data: vendors } = useVendors({ limit: 100 });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await raisePO.mutateAsync({ id: materialRequestId, vendorId: values.vendorId });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ShoppingCart className="h-3.5 w-3.5" /> Raise PO
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise purchase order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Vendor</Label>
            <Controller
              control={control}
              name="vendorId"
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.items.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name} {v.bisIsiApproved ? '· BIS/ISI' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Raising…' : 'Raise PO'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
