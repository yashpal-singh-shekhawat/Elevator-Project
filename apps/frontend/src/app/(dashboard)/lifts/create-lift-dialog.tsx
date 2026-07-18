'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateLift } from '@/hooks/queries/use-lifts';
import { useCustomers, useLiftTypes, useSites, useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  customerId: z.coerce.number().int().positive({ message: 'Select a customer' }),
  siteId: z.coerce.number().int().positive({ message: 'Select a site' }),
  liftTypeId: z.coerce.number().int().positive({ message: 'Select a lift type' }),
  statusId: z.coerce.number().int().positive({ message: 'Select a status' }),
  serialNumber: z.string().trim().min(1, 'Serial number is required'),
  model: z.string().trim().optional(),
  capacityKg: z.coerce.number().int().positive().optional().or(z.literal('' as unknown as number)),
  numberOfFloors: z.coerce.number().int().positive().optional().or(z.literal('' as unknown as number))
});

type FormValues = z.infer<typeof schema>;

export function CreateLiftDialog() {
  const [open, setOpen] = useState(false);
  const createLift = useCreateLift();

  const { data: customers } = useCustomers();
  const { data: liftTypes } = useLiftTypes();
  const { data: statuses } = useStatuses('LIFT');

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedCustomerId = watch('customerId');
  const { data: sites } = useSites(selectedCustomerId);

  // Reset the site whenever the customer changes so a stale site from another
  // customer can't be submitted.
  useEffect(() => {
    setValue('siteId', undefined as unknown as number);
  }, [selectedCustomerId, setValue]);

  async function onSubmit(values: FormValues) {
    const { customerId, capacityKg, numberOfFloors, ...rest } = values;
    await createLift.mutateAsync({
      ...rest,
      capacityKg: capacityKg || undefined,
      numberOfFloors: numberOfFloors || undefined
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New Lift
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add lift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
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
              <Label>Site</Label>
              <Controller
                control={control}
                name="siteId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                    disabled={!selectedCustomerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCustomerId ? 'Select site' : 'Pick a customer first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {sites?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.siteId && <p className="text-xs text-destructive">{errors.siteId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Lift type</Label>
              <Controller
                control={control}
                name="liftTypeId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lift type" />
                    </SelectTrigger>
                    <SelectContent>
                      {liftTypes?.map((lt) => (
                        <SelectItem key={lt.id} value={String(lt.id)}>
                          {lt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.liftTypeId && <p className="text-xs text-destructive">{errors.liftTypeId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="statusId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.statusId && <p className="text-xs text-destructive">{errors.statusId.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="serialNumber">Serial number</Label>
            <Input id="serialNumber" {...register('serialNumber')} />
            {errors.serialNumber && <p className="text-xs text-destructive">{errors.serialNumber.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="model">Model (optional)</Label>
              <Input id="model" {...register('model')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacityKg">Capacity (kg)</Label>
              <Input id="capacityKg" type="number" {...register('capacityKg')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numberOfFloors">Floors</Label>
              <Input id="numberOfFloors" type="number" {...register('numberOfFloors')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add lift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
