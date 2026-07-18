'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { useUpdateLift } from '@/hooks/queries/use-lifts';
import { useLiftTypes, useStatuses } from '@/hooks/queries/use-master-data';
import type { LiftListItem } from '@/lib/api/lifts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// siteId is omitted — the backend's updateLiftSchema forbids moving a lift to a
// different site, so the site/customer stay fixed once created.
const schema = z.object({
  liftTypeId: z.coerce.number().int().positive({ message: 'Select a lift type' }),
  statusId: z.coerce.number().int().positive({ message: 'Select a status' }),
  serialNumber: z.string().trim().min(1, 'Serial number is required'),
  model: z.string().trim().optional(),
  capacityKg: z.coerce.number().int().positive().optional().or(z.literal('' as unknown as number)),
  numberOfFloors: z.coerce.number().int().positive().optional().or(z.literal('' as unknown as number))
});

type FormValues = z.infer<typeof schema>;

export function EditLiftDialog({ lift }: { lift: LiftListItem }) {
  const [open, setOpen] = useState(false);
  const updateLift = useUpdateLift(lift.id);
  const { data: liftTypes } = useLiftTypes();
  const { data: statuses } = useStatuses('LIFT');

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      liftTypeId: lift.liftType?.id,
      statusId: lift.status?.id,
      serialNumber: lift.serialNumber,
      model: lift.model ?? '',
      capacityKg: (lift.capacityKg ?? '') as unknown as number,
      numberOfFloors: (lift.numberOfFloors ?? '') as unknown as number
    }
  });

  async function onSubmit(values: FormValues) {
    const { capacityKg, numberOfFloors, ...rest } = values;
    await updateLift.mutateAsync({
      ...rest,
      capacityKg: capacityKg || undefined,
      numberOfFloors: numberOfFloors || undefined
    });
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
          <DialogTitle>Edit lift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {lift.site && (
            <p className="text-sm text-muted-foreground">
              Site: <span className="font-medium text-foreground">{lift.site.name}</span>
            </p>
          )}

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
            <Label htmlFor="edit-lift-serial">Serial number</Label>
            <Input id="edit-lift-serial" {...register('serialNumber')} />
            {errors.serialNumber && <p className="text-xs text-destructive">{errors.serialNumber.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-lift-model">Model (optional)</Label>
              <Input id="edit-lift-model" {...register('model')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-lift-capacity">Capacity (kg)</Label>
              <Input id="edit-lift-capacity" type="number" {...register('capacityKg')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-lift-floors">Floors</Label>
              <Input id="edit-lift-floors" type="number" {...register('numberOfFloors')} />
            </div>
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
