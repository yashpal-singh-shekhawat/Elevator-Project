'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Plus, Trash2 } from 'lucide-react';
import { useReceiveGRN } from '@/hooks/queries/use-vendors';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  receivedItems: z
    .array(
      z.object({
        partNumber: z.string().trim().min(1, 'Required'),
        partName: z.string().trim().min(1, 'Required'),
        quantityReceived: z.coerce.number().int().positive({ message: 'Qty must be > 0' })
      })
    )
    .min(1, 'Add at least one received item')
});

type FormValues = z.infer<typeof schema>;

export function ReceiveGrnDialog({ poId, poCode }: { poId: number; poCode: string }) {
  const [open, setOpen] = useState(false);
  const receiveGRN = useReceiveGRN();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { receivedItems: [{ partNumber: '', partName: '', quantityReceived: 1 }] } });

  const { fields, append, remove } = useFieldArray({ control, name: 'receivedItems' });

  async function onSubmit(values: FormValues) {
    await receiveGRN.mutateAsync({ id: poId, input: values });
    reset({ receivedItems: [{ partNumber: '', partName: '', quantityReceived: 1 }] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Truck className="h-3.5 w-3.5" /> Receive GRN
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Receive goods — {poCode}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">Part number</Label>
                  <Input {...register(`receivedItems.${index}.partNumber` as const)} />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">Part name</Label>
                  <Input {...register(`receivedItems.${index}.partName` as const)} />
                </div>
                <div className="flex w-20 flex-col gap-1">
                  <Label className="text-xs">Qty received</Label>
                  <Input type="number" {...register(`receivedItems.${index}.quantityReceived` as const)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {errors.receivedItems?.message && <p className="text-xs text-destructive">{errors.receivedItems.message}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => append({ partNumber: '', partName: '', quantityReceived: 1 })}
            >
              <Plus className="h-3.5 w-3.5" /> Add item
            </Button>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Receiving…' : 'Confirm receipt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
