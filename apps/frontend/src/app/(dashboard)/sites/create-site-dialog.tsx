'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateSite } from '@/hooks/queries/use-sites-list';
import { useCustomers } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  customerId: z.coerce.number().int().positive({ message: 'Select a customer' }),
  name: z.string().trim().min(1, 'Site name is required'),
  addressLine1: z.string().trim().min(1, 'Address is required'),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional()
});

type FormValues = z.infer<typeof schema>;

export function CreateSiteDialog({ defaultCustomerId }: { defaultCustomerId?: number }) {
  const [open, setOpen] = useState(false);
  const createSite = useCreateSite();
  const { data: customers } = useCustomers();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { customerId: defaultCustomerId } });

  async function onSubmit(values: FormValues) {
    await createSite.mutateAsync(values);
    reset({ customerId: defaultCustomerId });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New Site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Customer</Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Site name</Label>
            <Input id="name" placeholder="e.g. Head Office Tower" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input id="addressLine1" {...register('addressLine1')} />
            {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
            <Input id="addressLine2" {...register('addressLine2')} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" {...register('pincode')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add site'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
