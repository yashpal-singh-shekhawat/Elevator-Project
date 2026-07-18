'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateMaterialRequest } from '@/hooks/queries/use-material-requests';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  coverageEligible: z.boolean().optional(),
  notes: z.string().trim().optional(),
  lineItems: z
    .array(
      z.object({
        partNumber: z.string().trim().min(1, 'Required'),
        partName: z.string().trim().min(1, 'Required'),
        quantityRequested: z.coerce.number().int().positive({ message: 'Qty must be > 0' })
      })
    )
    .min(1, 'Add at least one line item')
});

type FormValues = z.infer<typeof schema>;

export function CreateMaterialRequestDialog({ serviceTicketId }: { serviceTicketId: number }) {
  const [open, setOpen] = useState(false);
  const createMRD = useCreateMaterialRequest();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { coverageEligible: true, lineItems: [{ partNumber: '', partName: '', quantityRequested: 1 }] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  async function onSubmit(values: FormValues) {
    await createMRD.mutateAsync({ serviceTicketId, ...values });
    reset({ coverageEligible: true, lineItems: [{ partNumber: '', partName: '', quantityRequested: 1 }] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Raise Material Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise material request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
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
            {errors.lineItems?.message && <p className="text-xs text-destructive">{errors.lineItems.message}</p>}
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

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('coverageEligible')} />
            Covered under AMC (not billable to customer)
          </label>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
