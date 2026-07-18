'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateStatus } from '@/hooks/queries/use-master-data-admin';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Entity types that carry a status lifecycle (mirrors default-master-data.ts).
const ENTITY_TYPES = [
  'LEAD',
  'QUOTATION',
  'INSTALLATION_PROJECT',
  'INSTALLATION_TASK',
  'AMC_CONTRACT',
  'AMC_SCHEDULE',
  'AMC_VISIT',
  'LIFT'
] as const;

// Color hints understood by StatusBadge's COLOR_VARIANT_MAP.
const COLORS = ['slate', 'blue', 'green', 'amber', 'orange', 'red', 'indigo'] as const;

const schema = z.object({
  entityType: z.string().min(1, 'Select an entity type'),
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .regex(/^[A-Z_]+$/, 'UPPER_SNAKE_CASE only'),
  label: z.string().trim().min(1, 'Label is required'),
  color: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().optional()
});

type FormValues = z.infer<typeof schema>;

export function CreateStatusDialog({ defaultEntityType }: { defaultEntityType?: string }) {
  const [open, setOpen] = useState(false);
  const createStatus = useCreateStatus();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { entityType: defaultEntityType, sortOrder: 0 }
  });

  async function onSubmit(values: FormValues) {
    await createStatus.mutateAsync({
      entityType: values.entityType,
      code: values.code,
      label: values.label,
      color: values.color || undefined,
      sortOrder: values.sortOrder ?? 0
    });
    reset({ entityType: values.entityType, sortOrder: 0 });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Entity type</Label>
            <Controller
              control={control}
              name="entityType"
              render={({ field }) => (
                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.entityType && <p className="text-xs text-destructive">{errors.entityType.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status-code">Code</Label>
              <Input id="status-code" placeholder="IN_PROGRESS" {...register('code')} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status-label">Label</Label>
              <Input id="status-label" placeholder="In Progress" {...register('label')} />
              {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Color</Label>
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status-sort">Sort order</Label>
              <Input id="status-sort" type="number" {...register('sortOrder')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
