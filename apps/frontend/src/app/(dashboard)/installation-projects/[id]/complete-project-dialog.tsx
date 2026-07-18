'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { useCompleteInstallationProject } from '@/hooks/queries/use-installation-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const schema = z.object({
  serialNumber: z.string().trim().min(1, 'Required'),
  model: z.string().trim().optional(),
  capacityKg: z.coerce.number().int().positive().optional(),
  numberOfFloors: z.coerce.number().int().positive().optional(),
  installationDate: z.string().optional(),
  warrantyExpiryDate: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export function CompleteProjectDialog({ projectId }: { projectId: number }) {
  const [open, setOpen] = useState(false);
  const completeProject = useCompleteInstallationProject(projectId);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await completeProject.mutateAsync(values);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CheckCircle2 className="h-4 w-4" /> Complete Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete installation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This creates the physical Lift record and marks the project complete. This cannot be undone.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="serialNumber">Lift serial number</Label>
            <Input id="serialNumber" {...register('serialNumber')} />
            {errors.serialNumber && <p className="text-xs text-destructive">{errors.serialNumber.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...register('model')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacityKg">Capacity (kg)</Label>
              <Input id="capacityKg" type="number" {...register('capacityKg')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numberOfFloors">Floors served</Label>
              <Input id="numberOfFloors" type="number" {...register('numberOfFloors')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="warrantyExpiryDate">Warranty expiry</Label>
              <Input id="warrantyExpiryDate" type="date" {...register('warrantyExpiryDate')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Completing…' : 'Confirm completion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
