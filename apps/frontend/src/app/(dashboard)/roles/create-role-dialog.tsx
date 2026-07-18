'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateRole } from '@/hooks/queries/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  code: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9_]{1,48}$/, 'UPPER_SNAKE_CASE (letters, numbers, underscore)'),
  description: z.string().trim().max(255).optional().or(z.literal(''))
});

type FormValues = z.infer<typeof schema>;

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (roleId: number) => void;
}

// Turn a typed display name into a suggested UPPER_SNAKE_CASE code.
function toCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

export function CreateRoleDialog({ open, onOpenChange, onCreated }: CreateRoleDialogProps) {
  const createRole = useCreateRole();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ name: '', code: '', description: '' });
  }, [open, reset]);

  async function onSubmit(values: FormValues) {
    const role = await createRole.mutateAsync({
      code: values.code,
      name: values.name,
      description: values.description || undefined
    });
    onCreated?.(role.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create role</DialogTitle>
          <DialogDescription>
            Add a custom role, then choose its permissions from the matrix.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Role name</Label>
            <Input
              id="name"
              placeholder="Regional Supervisor"
              {...register('name', {
                onChange: (e) => setValue('code', toCode(e.target.value), { shouldValidate: true })
              })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Code</Label>
            <Input id="code" className="font-mono" placeholder="REGIONAL_SUPERVISOR" {...register('code')} />
            <p className="text-xs text-muted-foreground">Stable machine key · cannot be changed later.</p>
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={2} {...register('description')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
