'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check } from 'lucide-react';
import type { TenantUserDto } from '@lift-saas/shared-types';
import { useCreateUser, useUpdateUser } from '@/hooks/queries/use-users';
import { useRoles } from '@/hooks/queries/use-roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const baseSchema = {
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  roleId: z.coerce.number().int().positive('Select a role')
};

const createSchema = z.object({
  ...baseSchema,
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const editSchema = z.object({
  ...baseSchema,
  isActive: z.boolean()
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Present → edit mode; absent → create mode.
  user?: TenantUserDto | null;
}

// Simple readable temp password generator so admins don't have to invent one.
function suggestPassword() {
  return `Lift-${Math.random().toString(36).slice(2, 10)}`;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEdit = !!user;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id ?? 0);
  const { data: roles } = useRoles();

  const [copied, setCopied] = useState(false);
  const [genPassword, setGenPassword] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateValues & EditValues>({
    resolver: zodResolver((isEdit ? editSchema : createSchema) as never)
  });

  const roleId = watch('roleId');
  const isActive = watch('isActive');

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    const pw = isEdit ? '' : suggestPassword();
    setGenPassword(pw);
    reset({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      password: pw,
      roleId: user?.roleId ?? undefined,
      isActive: user?.isActive ?? true
    } as CreateValues & EditValues);
  }, [open, user, isEdit, reset]);

  async function onSubmit(values: CreateValues & EditValues) {
    if (isEdit && user) {
      await updateUser.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        roleId: values.roleId,
        isActive: values.isActive
      });
    } else {
      await createUser.mutateAsync({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        roleId: values.roleId
      });
    }
    onOpenChange(false);
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(genPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (non-HTTPS); ignore.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit user' : 'Add user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this user’s profile, role or access.'
              : 'Create a login for a member of your team. Share the temporary password with them.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select
              value={roleId ? String(roleId) : undefined}
              onValueChange={(v) => setValue('roleId', Number(v), { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Temporary password</Label>
              <div className="flex items-center gap-2">
                <Input id="password" className="font-mono" {...register('password')} />
                <Button type="button" variant="outline" size="sm" onClick={copyPassword}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this with the user. They should change it after first login.
              </p>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          )}

          {isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={!!isActive}
                onChange={(e) => setValue('isActive', e.target.checked)}
              />
              Account active
            </label>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
