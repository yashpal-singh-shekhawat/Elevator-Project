'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateInventoryStock } from '@/hooks/queries/use-inventory';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  partNumber: z.string().trim().min(1, 'Part number is required'),
  partName: z.string().trim().min(1, 'Part name is required'),
  description: z.string().trim().optional(),
  quantityOnHand: z.coerce.number().int().min(0).optional(),
  reorderLevel: z.coerce.number().int().min(0).optional(),
  location: z.string().trim().optional(),
  bisIsiCertified: z.boolean().optional(),
  unitCost: z.coerce.number().min(0).optional()
});

type FormValues = z.infer<typeof schema>;

export function CreateStockDialog() {
  const [open, setOpen] = useState(false);
  const createStock = useCreateInventoryStock();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { quantityOnHand: 0, reorderLevel: 0, bisIsiCertified: false } });

  async function onSubmit(values: FormValues) {
    await createStock.mutateAsync(values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Add Stock Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add inventory item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="partNumber">Part number</Label>
              <Input id="partNumber" {...register('partNumber')} />
              {errors.partNumber && <p className="text-xs text-destructive">{errors.partNumber.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="partName">Part name</Label>
              <Input id="partName" {...register('partName')} />
              {errors.partName && <p className="text-xs text-destructive">{errors.partName.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantityOnHand">Quantity on hand</Label>
              <Input id="quantityOnHand" type="number" {...register('quantityOnHand')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reorderLevel">Reorder level</Label>
              <Input id="reorderLevel" type="number" {...register('reorderLevel')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location (optional)</Label>
              <Input id="location" {...register('location')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unitCost">Unit cost (optional)</Label>
              <Input id="unitCost" type="number" step="0.01" {...register('unitCost')} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('bisIsiCertified')} />
            BIS/ISI certified
          </label>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
