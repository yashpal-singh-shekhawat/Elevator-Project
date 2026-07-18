'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Copy, Check } from 'lucide-react';
import type { TenantDto } from '@lift-saas/shared-types';
import { useCreateTenant, useUpdateTenant } from '@/hooks/queries/use-platform';
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
import { TenantLogo } from '@/components/shared/tenant-logo';
import { fileToDataUrl, validateLogoFile } from '@/lib/file-to-data-url';

const optionalEmail = z.string().trim().email('Enter a valid email').optional().or(z.literal(''));

const baseSchema = {
  companyName: z.string().trim().min(2, 'Company name is required').max(120),
  contactPerson: z.string().trim().max(120).optional().or(z.literal('')),
  email: optionalEmail,
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  address: z.string().trim().max(255).optional().or(z.literal(''))
};

const createSchema = z.object({
  ...baseSchema,
  companyUniqueCode: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,64}$/i, 'Code must be 2–64 letters, numbers or dashes')
});

const editSchema = z.object(baseSchema);

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Present → edit mode; absent → create mode.
  tenant?: TenantDto | null;
}

export function TenantFormDialog({ open, onOpenChange, tenant }: TenantFormDialogProps) {
  const isEdit = !!tenant;
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant(tenant?.id ?? 0);

  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [logoError, setLogoError] = useState<string | null>(null);
  // After a successful create, the backend returns one-time admin login details.
  // We show them in a "success" panel instead of closing the dialog immediately.
  const [credentials, setCredentials] = useState<NonNullable<TenantDto['adminCredentials']> | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CreateValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never
  });

  // Reset the form whenever the dialog opens or the target tenant changes so
  // create starts blank and edit is prefilled.
  useEffect(() => {
    if (!open) return;
    setLogoBase64(undefined);
    setLogoError(null);
    setCredentials(null);
    setCopied(null);
    reset({
      companyName: tenant?.companyName ?? '',
      companyUniqueCode: tenant?.companyUniqueCode ?? '',
      contactPerson: tenant?.contactPerson ?? '',
      email: tenant?.email ?? '',
      phone: tenant?.phone ?? '',
      address: tenant?.address ?? ''
    } as CreateValues);
  }, [open, tenant, reset]);

  const previewName = tenant?.companyName || 'New Tenant';
  // Show the freshly-picked logo, else the existing stored one.
  const previewLogo = useMemo(() => logoBase64 ?? tenant?.logoUrl ?? null, [logoBase64, tenant?.logoUrl]);

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateLogoFile(file);
    if (err) {
      setLogoError(err);
      return;
    }
    setLogoBase64(await fileToDataUrl(file));
  }

  async function onSubmit(values: CreateValues | EditValues) {
    // The mutation hooks already surface failures via toast (onError). Wrap in
    // try/catch so a rejected mutateAsync doesn't bubble up as an unhandled
    // runtime error (Next.js dev overlay) — we just keep the dialog open.
    try {
      if (isEdit && tenant) {
        await updateTenant.mutateAsync({
          companyName: values.companyName,
          contactPerson: values.contactPerson || undefined,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          logoBase64
        });
        onOpenChange(false);
      } else {
        const created = await createTenant.mutateAsync({
          companyName: values.companyName,
          companyUniqueCode: (values as CreateValues).companyUniqueCode,
          contactPerson: values.contactPerson || undefined,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          logoBase64
        });
        // Show the one-time admin login details; the user closes the dialog manually.
        if (created.adminCredentials) {
          setCredentials(created.adminCredentials);
        } else {
          onOpenChange(false);
        }
      }
    } catch {
      // Error toast is handled by the mutation's onError; keep the form open.
    }
  }

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      // Clipboard may be unavailable (e.g. non-HTTPS); ignore silently.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{credentials ? 'Tenant created' : isEdit ? 'Edit tenant' : 'Create tenant'}</DialogTitle>
          <DialogDescription>
            {credentials
              ? 'Share these first-login details with the tenant. The password is shown only once.'
              : isEdit
                ? 'Update this company’s profile and branding.'
                : 'Provision a new company workspace on the platform.'}
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-[var(--radius)] border border-success/40 bg-success/5 p-4">
              <ul className="flex flex-col gap-3">
                {[
                  { key: 'loginUrl', label: 'Login URL', value: credentials.loginUrl },
                  { key: 'email', label: 'Admin email', value: credentials.email },
                  { key: 'tempPassword', label: 'Temp password', value: credentials.tempPassword }
                ].map((row) => (
                  <li key={row.key} className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {row.label}
                      </span>
                      <span className="break-all font-mono text-sm">{row.value}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyValue(row.key, row.value)}
                    >
                      {copied === row.key ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              The tenant admin should change this password after first login. You won’t be able to see it again.
            </p>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {/* Company Information */}
          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Company Information
            </h3>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName">Company name *</Label>
              <Input id="companyName" placeholder="Acme Elevators" {...register('companyName')} />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
            </div>

            {!isEdit && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyUniqueCode">Company code *</Label>
                <Input id="companyUniqueCode" placeholder="acme" {...register('companyUniqueCode')} />
                <p className="text-xs text-muted-foreground">Used in URLs: /acme/login · cannot be changed later.</p>
                {errors.companyUniqueCode && (
                  <p className="text-xs text-destructive">{errors.companyUniqueCode.message}</p>
                )}
              </div>
            )}

            {/* Logo upload */}
            <div className="flex flex-col gap-1.5">
              <Label>Company logo</Label>
              <div className="flex items-center gap-3">
                <TenantLogo name={previewName} logoUrl={previewLogo} className="h-14 w-14" />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Button asChild type="button" variant="outline" size="sm">
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4" /> Upload
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="sr-only"
                          onChange={onPickLogo}
                        />
                      </label>
                    </Button>
                    {logoBase64 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setLogoBase64(undefined)}>
                        <X className="h-4 w-4" /> Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or SVG · max 2 MB.</p>
                </div>
              </div>
              {logoError && <p className="text-xs text-destructive">{logoError}</p>}
            </div>
          </section>

          {/* Contact Information */}
          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contact Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contactPerson">Contact person</Label>
                <Input id="contactPerson" placeholder="Rajesh Kumar" {...register('contactPerson')} />
                {errors.contactPerson && (
                  <p className="text-xs text-destructive">{errors.contactPerson.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+91 98200 11111" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="contact@acme.com" {...register('email')} />
              <p className="text-xs text-muted-foreground">Must be unique across all tenants.</p>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={2} placeholder="Plot 14, MIDC, Pune" {...register('address')} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create tenant'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
