'use client';

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateVendorPO } from '@/hooks/queries/use-vendors';
import { useVendors } from '@/hooks/queries/use-vendors';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  vendorId: z.coerce.number().int().positive({ message: 'Select a vendor' }),
  expectedDelivery: z.string().optional(),
  bisIsiCertFlag: z.boolean().optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional(),
  lineItems: z
    .array(
      z.object({
        partNumber: z.string().trim().min(1, 'Required'),
        partName: z.string().trim().min(1, 'Required'),
        quantityRequested: z.coerce.number().int().positive({ message: 'Qty must be > 0' })
      })
    )
    .optional()
});

type FormValues = z.infer<typeof schema>;

export function CreatePODialog() {
  const [open, setOpen] = useState(false);
  const createPO = useCreateVendorPO();
  const { data: vendors } = useVendors({ limit: 100 });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { bisIsiCertFlag: false, lineItems: [{ partNumber: '', partName: '', quantityRequested: 1 }] } });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  async function onSubmit(values: FormValues) {
    await createPO.mutateAsync(values);
    reset({ bisIsiCertFlag: false, lineItems: [{ partNumber: '', partName: '', quantityRequested: 1 }] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create purchase order</DialogTitle>
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
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expectedDelivery">Expected delivery (optional)</Label>
              <Input id="expectedDelivery" type="date" {...register('expectedDelivery')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="totalAmount">Total amount (optional)</Label>
              <Input id="totalAmount" type="number" step="0.01" {...register('totalAmount')} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('bisIsiCertFlag')} />
            Require BIS/ISI certification
          </label>

          <div className="flex flex-col gap-2">
            <Label>Line items (optional)</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">Part number</Label>
                  <Input {...register(`lineItems.${index}.partNumber` as const)} />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">Part name</Label>
                  <Input {...register(`lineItems.${index}.partName` as const)} />
                </div>
                <div className="flex w-20 flex-col gap-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" {...register(`lineItems.${index}.quantityRequested` as const)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => append({ partNumber: '', partName: '', quantityRequested: 1 })}
            >
              <Plus className="h-3.5 w-3.5" /> Add line item
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create PO'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
