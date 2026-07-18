'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateCustomer } from '@/hooks/queries/use-customers';
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

export function CreateCustomerDialog() {
  const [open, setOpen] = useState(false);
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await createCustomer.mutateAsync({ ...values, email: values.email || undefined });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New Customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Customer name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" {...register('phone')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gstNumber">GST number (optional)</Label>
            <Input id="gstNumber" {...register('gstNumber')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="billingAddress">Billing address (optional)</Label>
            <Textarea id="billingAddress" {...register('billingAddress')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
