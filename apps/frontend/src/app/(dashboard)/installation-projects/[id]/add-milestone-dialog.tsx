'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateInstallationMilestone } from '@/hooks/queries/use-installation-milestones';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Milestones reuse INSTALLATION_PROJECT statuses (see backend schema.prisma comment).
const schema = z.object({
  name: z.string().trim().min(1, 'Required'),
  statusId: z.coerce.number().int().positive({ message: 'Select a status' })
});

type FormValues = z.infer<typeof schema>;

export function AddMilestoneDialog({ installationProjectId }: { installationProjectId: number }) {
  const [open, setOpen] = useState(false);
  const { data: statuses } = useStatuses('INSTALLATION_PROJECT');
  const createMilestone = useCreateInstallationMilestone(installationProjectId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await createMilestone.mutateAsync(values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Add milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Site Survey / Equipment Delivered / Final Handover" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
