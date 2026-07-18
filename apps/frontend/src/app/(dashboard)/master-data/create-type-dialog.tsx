'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateLiftType, useCreateServiceType } from '@/hooks/queries/use-master-data-admin';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Lift types and service types share the exact same shape (code + name), so a
// single dialog drives both — the `kind` prop picks the mutation.
const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .regex(/^[A-Z_]+$/, 'UPPER_SNAKE_CASE only'),
  name: z.string().trim().min(1, 'Name is required')
});

type FormValues = z.infer<typeof schema>;

export function CreateTypeDialog({ kind }: { kind: 'lift' | 'service' }) {
  const [open, setOpen] = useState(false);
  const createLiftType = useCreateLiftType();
  const createServiceType = useCreateServiceType();
  const mutation = kind === 'lift' ? createLiftType : createServiceType;
  const label = kind === 'lift' ? 'Lift Type' : 'Service Type';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await mutation.mutateAsync(values);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {label.toLowerCase()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type-code">Code</Label>
            <Input id="type-code" placeholder={kind === 'lift' ? 'PASSENGER' : 'PREVENTIVE'} {...register('code')} />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type-name">Name</Label>
            <Input id="type-name" placeholder={kind === 'lift' ? 'Passenger Lift' : 'Preventive Maintenance'} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : `Add ${label.toLowerCase()}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
