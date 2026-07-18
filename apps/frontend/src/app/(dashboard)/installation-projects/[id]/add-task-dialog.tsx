'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateInstallationTask } from '@/hooks/queries/use-installation-tasks';
import { useStatuses } from '@/hooks/queries/use-master-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  title: z.string().trim().min(1, 'Required'),
  description: z.string().trim().optional(),
  statusId: z.coerce.number().int().positive({ message: 'Select a status' }),
  dueDate: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function AddTaskDialog({ installationProjectId }: { installationProjectId: number }) {
  const [open, setOpen] = useState(false);
  const { data: statuses } = useStatuses('INSTALLATION_TASK');
  const createTask = useCreateInstallationTask(installationProjectId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await createTask.mutateAsync(values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Add task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
