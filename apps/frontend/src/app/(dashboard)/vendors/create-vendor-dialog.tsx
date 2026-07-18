'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateVendor } from '@/hooks/queries/use-vendors';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  bisIsiApproved: z.boolean().optional(),
  notes: z.string().trim().optional()
});

type FormValues = z.infer<typeof schema>;

export function CreateVendorDialog() {
  const [open, setOpen] = useState(false);
  const createVendor = useCreateVendor();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { bisIsiApproved: false } });

  async function onSubmit(values: FormValues) {
    await createVendor.mutateAsync({ ...values, contactEmail: values.contactEmail || undefined });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New Vendor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Vendor name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactName">Contact name</Label>
              <Input id="contactName" {...register('contactName')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" {...register('contactPhone')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" type="email" {...register('contactEmail')} />
            {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address (optional)</Label>
            <Textarea id="address" {...register('address')} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register('bisIsiApproved')} />
            BIS/ISI approved supplier
          </label>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
