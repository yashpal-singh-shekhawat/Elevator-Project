'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { useAssignTicket } from '@/hooks/queries/use-service-tickets';
import { useUsers } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  technicianId: z.coerce.number().int().positive({ message: 'Select a technician' })
});

type FormValues = z.infer<typeof schema>;

export function AssignDialog({ ticketId }: { ticketId: number }) {
  const [open, setOpen] = useState(false);
  const assign = useAssignTicket();
  const { data: users } = useUsers();
  // Role codes are DEPARTMENT_ROLE (e.g. SERVICE_ENGINEER), so match service
  // roles by prefix and fall back to all users if none qualify — otherwise the
  // dropdown is empty.
  const preferred = users?.filter((u) => u.roleCode?.startsWith('SERVICE') || u.roleCode?.startsWith('TECHNICIAN'));
  const technicians = preferred && preferred.length > 0 ? preferred : users;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await assign.mutateAsync({ id: ticketId, technicianId: values.technicianId });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-3.5 w-3.5" /> Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign technician</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Technician</Label>
            <Controller
              control={control}
              name="technicianId"
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians?.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.firstName} {t.lastName}
                      </SelectItem>
                    ))}
                    {technicians?.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No technicians found</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.technicianId && <p className="text-xs text-destructive">{errors.technicianId.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
