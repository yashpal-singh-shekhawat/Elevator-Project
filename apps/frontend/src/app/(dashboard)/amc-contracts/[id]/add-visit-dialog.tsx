'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateAmcVisit } from '@/hooks/queries/use-amc-visits';
import { useAmcSchedules } from '@/hooks/queries/use-amc-schedules';
import { useServiceTypes, useStatuses, useUsers } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  amcScheduleId: z.coerce.number().int().positive().optional(),
  serviceTypeId: z.coerce.number().int().positive({ message: 'Select a service type' }),
  statusId: z.coerce.number().int().positive({ message: 'Select a status' }),
  technicianId: z.coerce.number().int().positive().optional(),
  visitDate: z.string().min(1, 'Required')
});

type FormValues = z.infer<typeof schema>;

export function AddVisitDialog({ amcContractId, liftId }: { amcContractId: number; liftId: number }) {
  const [open, setOpen] = useState(false);
  const { data: statuses } = useStatuses('AMC_VISIT');
  const { data: serviceTypes } = useServiceTypes();
  const { data: users } = useUsers();
  // Role codes are DEPARTMENT_ROLE (e.g. SERVICE_ENGINEER), so match service
  // roles by prefix and fall back to all users if none qualify — otherwise the
  // dropdown is empty.
  const preferredTechs = users?.filter((u) => u.roleCode?.startsWith('SERVICE') || u.roleCode?.startsWith('TECHNICIAN'));
  const technicians = preferredTechs && preferredTechs.length > 0 ? preferredTechs : users;
  const { data: schedules } = useAmcSchedules({ amcContractId, limit: 100 });
  const plannedSchedules = schedules?.items.filter((s) => s.status.code === 'PLANNED');

  const createVisit = useCreateAmcVisit(amcContractId);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await createVisit.mutateAsync({ ...values, liftId });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Schedule visit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {plannedSchedules && plannedSchedules.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Link to planned schedule (optional)</Label>
              <Controller
                control={control}
                name="amcScheduleId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ad-hoc / breakdown visit" />
                    </SelectTrigger>
                    <SelectContent>
                      {plannedSchedules.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {new Date(s.scheduledDate).toLocaleDateString()} — {s.serviceType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Service type</Label>
              <Controller
                control={control}
                name="serviceTypeId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes?.map((st) => (
                        <SelectItem key={st.id} value={String(st.id)}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.serviceTypeId && <p className="text-xs text-destructive">{errors.serviceTypeId.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="statusId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Technician (optional)</Label>
              <Controller
                control={control}
                name="technicianId"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians?.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.firstName} {t.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visitDate">Visit date</Label>
              <Input id="visitDate" type="date" {...register('visitDate')} />
              {errors.visitDate && <p className="text-xs text-destructive">{errors.visitDate.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling…' : 'Schedule visit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
