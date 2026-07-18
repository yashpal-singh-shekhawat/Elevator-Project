'use client';

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateInvoice } from '@/hooks/queries/use-invoices';
import { useAmcContracts } from '@/hooks/queries/use-amc-contracts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  amcContractId: z.coerce.number().int().positive({ message: 'Select a contract' }),
  dueDate: z.string().optional(),
  notes: z.string().trim().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().trim().min(1, 'Required'),
        quantity: z.coerce.number().int().positive().optional(),
        unitPrice: z.coerce.number().min(0, 'Required')
      })
    )
    .min(1, 'Add at least one line item')
});

type FormValues = z.infer<typeof schema>;

export function CreateInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const createInvoice = useCreateInvoice();
  const { data: contracts } = useAmcContracts({ limit: 100 });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { lineItems: [{ description: '', quantity: 1, unitPrice: 0 }] } });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  async function onSubmit(values: FormValues) {
    await createInvoice.mutateAsync({
      entityType: 'AMC_CONTRACT',
      entityId: values.amcContractId,
      amcContractId: values.amcContractId,
      dueDate: values.dueDate,
      notes: values.notes,
      lineItems: values.lineItems
    });
    reset({ lineItems: [{ description: '', quantity: 1, unitPrice: 0 }] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>AMC contract</Label>
            <Controller
              control={control}
              name="amcContractId"
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts?.items.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.contractNumber} · {c.customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.amcContractId && <p className="text-xs text-destructive">{errors.amcContractId.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate">Due date (optional)</Label>
            <Input id="dueDate" type="date" {...register('dueDate')} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Line items</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">Description</Label>
                  <Input {...register(`lineItems.${index}.description` as const)} />
                </div>
                <div className="flex w-16 flex-col gap-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" {...register(`lineItems.${index}.quantity` as const)} />
                </div>
                <div className="flex w-24 flex-col gap-1">
                  <Label className="text-xs">Unit price</Label>
                  <Input type="number" step="0.01" {...register(`lineItems.${index}.unitPrice` as const)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {errors.lineItems?.message && <p className="text-xs text-destructive">{errors.lineItems.message}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            >
              <Plus className="h-3.5 w-3.5" /> Add line item
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
