'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { useUpdateCustomer } from '@/hooks/queries/use-customers';
import type { CustomerDto } from '@lift-saas/shared-types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  billingAddress: z.string().trim().optional()
});

type FormValues = z.infer<typeof schema>;

export function EditCustomerDialog({ customer }: { customer: CustomerDto }) {
  const [open, setOpen] = useState(false);
  const updateCustomer = useUpdateCustomer(customer.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer.name,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      gstNumber: customer.gstNumber ?? '',
      billingAddress: customer.billingAddress ?? ''
    }
  });

  async function onSubmit(values: FormValues) {
    await updateCustomer.mutateAsync({ ...values, email: values.email || undefined });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Customer name</Label>
            <Input id="edit-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-email">Email (optional)</Label>
              <Input id="edit-email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone">Phone (optional)</Label>
              <Input id="edit-phone" {...register('phone')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-gst">GST number (optional)</Label>
            <Input id="edit-gst" {...register('gstNumber')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-billing">Billing address (optional)</Label>
            <Textarea id="edit-billing" {...register('billingAddress')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
